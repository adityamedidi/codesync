import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page center-page">
      <h1 className="grad">404</h1>
      <p>This page does not exist. The room you are looking for may have expired.</p>
      <Link className="btn primary" to="/">
        Back to home
      </Link>
    </div>
  );
}
