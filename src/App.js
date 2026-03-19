import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Blogs from "./pages/Blogs";
import Blogs2 from "./pages/Blogs2";
import Contact from "./pages/Contact";
import NoPage from "./pages/NoPage";
import { About } from "./pages/about";
import { RuleSetAndFleetChooser } from "./pages/ruleset_and_fleet_chooser";
import { Builder } from "./pages/builder";
import { Header, Main } from "./components/page";
import { RulesetBar } from "./components/rulesetbar";
import { RuleSetChooser } from "./pages/rulesetchooser/RuleSetChooser";
import { Dataset } from "./pages/dataset";
import { setLists } from "./state/lists";

import "./App.css";

export default function App() {
  const dispatch = useDispatch();

  // Hydrate lists from localStorage on startup. note: if you are running two of
  // these in a browser, they will overwrite one another (acceptable side-effect).
  useEffect(() => {
    const saved = localStorage.getItem("mowb.lists");
    if (saved) {
      try {
        const lists = JSON.parse(saved);
        if (Array.isArray(lists)) {
          dispatch(setLists(lists));
        }
      } catch (e) {
        // Ignore corrupt localStorage data; keep the default initial state.
      }
    }
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/*<Route path="/" element={<><Header /><Layout /></>} />*/}
        <Route index element={<><Header /><RulesetBar /><Home /><Main><RuleSetAndFleetChooser />{<h1>Ipsum Lorem</h1>}</Main></>} />
        <Route path="blogs" element={<><Header /><Blogs /></>}>
          <Route path="blogs2" element={<Blogs2 />} />
        </Route>
        <Route path="contact" element={<><Header /><Contact /></>} />
        <Route path="about" element={<><About /></>} />
        <Route path="Builder" element={<><Builder /></>} />
        <Route path="RuleSetChooser" element={<><RuleSetChooser /></>} />
        <Route path="datasets" element={<><Dataset /></>} />
        <Route path="*" element={<><Header /><NoPage /></>} />
      </Routes>
    </BrowserRouter>
  );
}
