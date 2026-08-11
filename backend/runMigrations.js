const sql = require('mssql/msnodesqlv8');

const migrationQueries = [
    // 1. Update the CHECK constraint for ReservationStatus
    `
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CHK_Status')
    BEGIN
        ALTER TABLE Reservation DROP CONSTRAINT CHK_Status;
        ALTER TABLE Reservation ADD CONSTRAINT CHK_Status 
            CHECK (ReservationStatus IN ('Pending', 'Confirmed', 'Denied', 'Cancelled', 'Fulfilled'));
    END
    `,

    // 2. View: vw_ReservationDetails
    `
    CREATE OR ALTER VIEW vw_ReservationDetails AS
    SELECT 
        r.ResID, r.ReservationDate, r.StartTime, r.EndTime, r.ReservationStatus, r.PreOrderState,
        c.CustomerID, c.Name AS CustomerName, c.Phone, c.Email,
        t.TableID, t.Capacity, t.Status AS TableStatus,
        z.ZoneName, z.SurchargeAmount
    FROM Reservation r
    JOIN Customer c ON r.CustomerID = c.CustomerID
    JOIN RestaurantTable t ON r.TableID = t.TableID
    JOIN TableZone z ON t.ZoneID = z.ZoneID;
    `,

    // 3. View: vw_TableDetails
    `
    CREATE OR ALTER VIEW vw_TableDetails AS
    SELECT 
        t.TableID, t.Capacity, t.Status,
        z.ZoneID, z.ZoneName, z.SurchargeAmount
    FROM RestaurantTable t
    JOIN TableZone z ON t.ZoneID = z.ZoneID;
    `,

    // 4. Stored Procedure: sp_CreateReservation (Transactions & Conflict Detection)
    `
    CREATE OR ALTER PROCEDURE sp_CreateReservation
        @CustomerID INT,
        @TableID INT,
        @ReservationDate DATE,
        @StartTime TIME,
        @EndTime TIME
    AS
    BEGIN
        SET NOCOUNT ON;
        BEGIN TRY
            BEGIN TRANSACTION;

            -- Check for conflicts
            DECLARE @ConflictCount INT;
            SELECT @ConflictCount = COUNT(*)
            FROM Reservation
            WHERE TableID = @TableID
              AND ReservationDate = @ReservationDate
              AND ReservationStatus IN ('Confirmed', 'Pending')
              AND (
                  (@StartTime >= StartTime AND @StartTime < EndTime) OR
                  (@EndTime > StartTime AND @EndTime <= EndTime) OR
                  (@StartTime <= StartTime AND @EndTime >= EndTime)
              );

            IF @ConflictCount > 0
            BEGIN
                -- Throw error if conflict exists
                THROW 51000, 'Table is already booked during this time.', 1;
            END

            -- Insert if no conflict
            INSERT INTO Reservation (CustomerID, TableID, ReservationDate, StartTime, EndTime, ReservationStatus, PreOrderState)
            VALUES (@CustomerID, @TableID, @ReservationDate, @StartTime, @EndTime, 'Pending', 'None');

            -- Return the newly created ID
            SELECT SCOPE_IDENTITY() AS ResID;

            COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            IF @@TRANCOUNT > 0
                ROLLBACK TRANSACTION;
            THROW; -- Re-throw error to the caller
        END CATCH
    END;
    `,

    // 5. Stored Procedure: sp_UpdateReservationStatus
    `
    CREATE OR ALTER PROCEDURE sp_UpdateReservationStatus
        @ResID INT,
        @NewStatus VARCHAR(20)
    AS
    BEGIN
        SET NOCOUNT ON;
        BEGIN TRY
            BEGIN TRANSACTION;

            -- Update Reservation Status
            UPDATE Reservation
            SET ReservationStatus = @NewStatus
            WHERE ResID = @ResID;

            COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            IF @@TRANCOUNT > 0
                ROLLBACK TRANSACTION;
            THROW;
        END CATCH
    END;
    `,

    // 6. Stored Procedure: sp_AddPreOrder
    `
    CREATE OR ALTER PROCEDURE sp_AddPreOrder
        @ResID INT,
        @ItemID INT,
        @Quantity INT
    AS
    BEGIN
        SET NOCOUNT ON;
        BEGIN TRY
            BEGIN TRANSACTION;

            -- Insert the order detail
            INSERT INTO OrderDetail (ResID, ItemID, Quantity) 
            VALUES (@ResID, @ItemID, @Quantity);

            DECLARE @NewOrderID INT = SCOPE_IDENTITY();

            -- Update Reservation PreOrderState
            UPDATE Reservation 
            SET PreOrderState = 'Placed' 
            WHERE ResID = @ResID;

            SELECT @NewOrderID AS OrderID;

            COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            IF @@TRANCOUNT > 0
                ROLLBACK TRANSACTION;
            THROW;
        END CATCH
    END;
    `,

    // 7. CHECK constraint: RestaurantTable.Status must be a known value
    `
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CHK_TableStatus')
        ALTER TABLE RestaurantTable DROP CONSTRAINT CHK_TableStatus;
    ALTER TABLE RestaurantTable ADD CONSTRAINT CHK_TableStatus
        CHECK (Status IN ('Available', 'Reserved', 'Maintenance'));
    `,

    // 8. CHECK constraint: Reservation.EndTime must be after StartTime
    `
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CHK_ResTime')
        ALTER TABLE Reservation DROP CONSTRAINT CHK_ResTime;
    ALTER TABLE Reservation ADD CONSTRAINT CHK_ResTime
        CHECK (EndTime > StartTime);
    `,

    // 9. CHECK constraint: OrderDetail.Quantity must be positive
    `
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CHK_Quantity')
        ALTER TABLE OrderDetail DROP CONSTRAINT CHK_Quantity;
    ALTER TABLE OrderDetail ADD CONSTRAINT CHK_Quantity
        CHECK (Quantity > 0);
    `,

    // 10. CHECK constraint: Menu.Price must be non-negative
    `
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CHK_Price')
        ALTER TABLE Menu DROP CONSTRAINT CHK_Price;
    ALTER TABLE Menu ADD CONSTRAINT CHK_Price
        CHECK (Price >= 0);
    `
];

async function runMigrations(pool) {
    for (let i = 0; i < migrationQueries.length; i++) {
        try {
            await pool.request().query(migrationQueries[i]);
            console.log(`Migration ${i + 1}/${migrationQueries.length} executed successfully.`);
        } catch (err) {
            console.error(`Migration ${i + 1} failed:`, err.message);
            throw err;
        }
    }
}

module.exports = { runMigrations };
