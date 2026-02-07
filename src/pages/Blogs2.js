import { Outlet, Link } from "react-router-dom";

const Blogs2 = () => {
  return (
    <>
    Blog2 Articles
      <nav>
        <ul>
          <div style={{"background-color": "red"}}>
          <li>
            <Link to="/">Home</Link>
          </li>
          </div>
          <li>
            <Link to="/blogs">Blogs</Link>
          </li>
          <li>
            <Link to="/contact">Contact</Link>
          </li>
        </ul>
      </nav>
      <Outlet />
    </>
  );
};

export default Blogs2;
