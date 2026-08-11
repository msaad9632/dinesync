-- ==========================================
-- DineSync: Restaurant Reservation System
-- Database Setup Script
-- ==========================================

-- Create the database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'DineSyncDB')
BEGIN
    CREATE DATABASE DineSyncDB;
END
GO

USE DineSyncDB;
GO

-- ==========================================
-- Drop tables if they exist (for clean setup)
-- ==========================================
IF OBJECT_ID('OrderDetail', 'U') IS NOT NULL DROP TABLE OrderDetail;
IF OBJECT_ID('Reservation', 'U') IS NOT NULL DROP TABLE Reservation;
IF OBJECT_ID('Menu', 'U') IS NOT NULL DROP TABLE Menu;
IF OBJECT_ID('RestaurantTable', 'U') IS NOT NULL DROP TABLE RestaurantTable;
IF OBJECT_ID('TableZone', 'U') IS NOT NULL DROP TABLE TableZone;
IF OBJECT_ID('Customer', 'U') IS NOT NULL DROP TABLE Customer;
GO

-- ==========================================
-- Create Tables
-- ==========================================

CREATE TABLE Customer (
    CustomerID INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Phone VARCHAR(15),
    Email VARCHAR(100)
);

CREATE TABLE TableZone (
    ZoneID INT IDENTITY(1,1) PRIMARY KEY,
    ZoneName VARCHAR(50) NOT NULL,
    SurchargeAmount DECIMAL(10, 2) DEFAULT 0.00
);

CREATE TABLE RestaurantTable (
    TableID INT IDENTITY(1,1) PRIMARY KEY,
    ZoneID INT,
    Capacity INT NOT NULL,
    Status VARCHAR(20) DEFAULT 'Available',
    CONSTRAINT FK_Zone FOREIGN KEY (ZoneID) 
        REFERENCES TableZone(ZoneID) 
        ON DELETE SET NULL
);

CREATE TABLE Reservation (
    ResID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerID INT,
    TableID INT,
    ReservationDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    ReservationStatus VARCHAR(20) DEFAULT 'Pending',
    PreOrderState VARCHAR(20) DEFAULT 'None',
    CONSTRAINT FK_Customer FOREIGN KEY (CustomerID) 
        REFERENCES Customer(CustomerID) 
        ON DELETE CASCADE,
    CONSTRAINT FK_Table FOREIGN KEY (TableID) 
        REFERENCES RestaurantTable(TableID) 
        ON DELETE CASCADE,
    CONSTRAINT CHK_Status CHECK (ReservationStatus IN ('Pending', 'Confirmed', 'Denied', 'Cancelled'))
);

CREATE TABLE Menu (
    ItemID INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Price DECIMAL(10, 2) NOT NULL,
    Category VARCHAR(50)
);

CREATE TABLE OrderDetail (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    ResID INT,
    ItemID INT,
    Quantity INT NOT NULL DEFAULT 1,
    CONSTRAINT FK_Reservation FOREIGN KEY (ResID) 
        REFERENCES Reservation(ResID) 
        ON DELETE CASCADE,
    CONSTRAINT FK_Menu FOREIGN KEY (ItemID) 
        REFERENCES Menu(ItemID) 
        ON DELETE CASCADE
);
GO

-- ==========================================
-- Seed Data
-- ==========================================

-- Customers
INSERT INTO Customer (Name, Phone, Email) VALUES
('Ahmed Raza', '03211234567', 'ahmed.raza@gmail.com'),
('Fatima Tariq', '03339876543', 'fatima.t@yahoo.com'),
('Usman Bilal', '03005554443', 'usman.b@gmail.com'),
('Ayesha Khan', '03451112233', 'ayesha.k@hotmail.com');

-- Zones
INSERT INTO TableZone (ZoneName, SurchargeAmount) VALUES
('Main Dining', 0.00),
('Patio', 5.00),
('VIP Lounge', 20.00),
('Rooftop', 15.00);

-- Tables
INSERT INTO RestaurantTable (ZoneID, Capacity, Status) VALUES
(1, 4, 'Available'),
(1, 2, 'Available'),
(2, 6, 'Reserved'),
(3, 8, 'Available'),
(2, 4, 'Maintenance');

-- Menu Items
INSERT INTO Menu (Name, Price, Category) VALUES
('Margherita Pizza', 12.50, 'Pizza'),
('Diet Soda', 2.00, 'Beverage'),
('Wagyu Steak', 85.00, 'Main Course'),
('Pumpkin Soup', 8.50, 'Seasonal'),
('Garlic Bread', 5.00, 'Appetizer'),
('Truffle Fries', 10.00, 'Side');

-- Reservations
INSERT INTO Reservation (CustomerID, TableID, ReservationDate, StartTime, EndTime, ReservationStatus, PreOrderState) VALUES
(1, 1, '2026-05-10', '18:00', '19:00', 'Pending', 'Placed'),
(1, 2, '2026-05-11', '19:00', '20:00', 'Confirmed', 'Placed'),
(1, 1, '2026-05-12', '20:00', '21:00', 'Confirmed', 'Placed'),
(1, 3, '2026-05-13', '18:30', '20:30', 'Confirmed', 'Placed'),
(2, 4, '2026-05-14', '19:00', '21:00', 'Confirmed', 'Placed'),
(3, 2, '2026-05-15', '20:00', '21:30', 'Confirmed', 'None');

-- Order Details
INSERT INTO OrderDetail (ResID, ItemID, Quantity) VALUES
(1, 4, 2),
(2, 3, 1),
(3, 5, 3),
(4, 1, 2),
(5, 1, 1),
(5, 2, 2);
GO

PRINT 'DineSync database setup complete!';
GO
