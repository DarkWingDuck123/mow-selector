import { Outlet, Link } from "react-router-dom";

const Blogs = () => {
  return (
    <>
    <h1>Blog Articles</h1>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/blogs/blogs2">Blogs2</Link>
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

export default Blogs;
