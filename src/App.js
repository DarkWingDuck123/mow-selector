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

import "./App.css";

export default function App() {
  // Initialize the lists slice in the redux datastore to the local storage mowb.lists
  // note: if you are running two of these in a browser, they will overwrite one
  // another (I'm okay with that side-effect though).
  // TODO: dispatch(setLists(JSON.parse(localStorage.getItem("mowb.lists"))));

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
        <Route path="Builder/:ruleset/:factionId/:listId" element={<><Builder /></>} />
        <Route path="RuleSetChooser" element={<><RuleSetChooser /></>} />
        <Route path="*" element={<><Header /><NoPage /></>} />
      </Routes>
    </BrowserRouter>
  );
}
