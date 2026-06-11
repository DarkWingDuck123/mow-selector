import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Blogs from "./pages/Blogs";
import Blogs2 from "./pages/Blogs2";
import Contact from "./pages/Contact";
import NoPage from "./pages/NoPage";
import { About } from "./pages/about";
import { Builder } from "./pages/builder";
import { CardBuilder } from "./pages/cardbuilder";
import { FactionBuilder } from "./pages/factionbuilder";
import { Header } from "./components/page";
import { RuleSetChooser } from "./pages/rulesetchooser/RuleSetChooser";
import { Dataset } from "./pages/dataset";
import { setLists } from "./state/lists";
import { setCustomFactions } from "./state/customFactions";
import { setCustomCards } from "./state/customCards";

import "./App.css";

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    [
      ["mowb.lists", setLists],
      ["mowb.customFactions", setCustomFactions],
      ["mowb.customCards", setCustomCards],
    ].forEach(([key, action]) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (Array.isArray(data)) dispatch(action(data));
      } catch {
        // Ignore corrupt localStorage data; keep the default initial state.
      }
    });
  }, [dispatch]);

  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Routes>
        {/*<Route path="/" element={<><Header /><Layout /></>} />*/}
        <Route index element={<><Header /><Home /></>} />
        <Route path="blogs" element={<><Header /><Blogs /></>}>
          <Route path="blogs2" element={<Blogs2 />} />
        </Route>
        <Route path="contact" element={<><Header /><Contact /></>} />
        <Route path="about" element={<><About /></>} />
        <Route path="Builder" element={<><Builder /></>} />
        <Route path="RuleSetChooser" element={<><RuleSetChooser /></>} />
        <Route path="datasets" element={<><Dataset /></>} />
        <Route path="CardBuilder" element={<><CardBuilder /></>} />
        <Route path="FactionBuilder" element={<><FactionBuilder /></>} />
        <Route path="*" element={<><Header /><NoPage /></>} />
      </Routes>
    </BrowserRouter>
  );
}
