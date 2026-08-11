// ==========================================
// 404 Page
// ==========================================
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">🔎</div>
      <p>Page not found.</p>
      <p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Dashboard
        </Link>
      </p>
    </div>
  );
}

export default NotFound;
