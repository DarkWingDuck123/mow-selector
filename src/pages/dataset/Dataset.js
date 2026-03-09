import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Helmet } from "react-helmet-async";

import { Header, Main } from "../../components/page";
import { Button } from "../../components/button";
import { setLists } from "../../state/lists";

import "./Dataset.css";

export const Dataset = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const lists = useSelector((state) => state.lists);
  const [status, setStatus] = useState(null);
  const mergeInputRef = useRef(null);
  const replaceInputRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleExport = () => {
    const json = JSON.stringify(lists, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mowb-lists.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    if (!window.confirm("This will permanently delete all your fleet lists. Are you sure?")) {
      return;
    }
    dispatch(setLists([]));
    setStatus({ type: "success", message: "All lists cleared." });
  };

  const readImportFile = (file, onParsed) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) {
          setStatus({ type: "error", message: "Invalid file: expected a JSON array of lists." });
          return;
        }
        onParsed(imported);
      } catch {
        setStatus({ type: "error", message: "Failed to parse file. Make sure it is a valid JSON export." });
      }
    };
    reader.readAsText(file);
  };

  const handleImportReplace = (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    readImportFile(file, (imported) => {
      dispatch(setLists(imported));
      setStatus({ type: "success", message: `Replaced with ${imported.length} list(s) from file.` });
    });
  };

  const handleImportMerge = (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    readImportFile(file, (imported) => {
      const merged = [...lists];
      let added = 0;
      let updated = 0;
      imported.forEach((importedList) => {
        const existingIndex = merged.findIndex((l) => l.id === importedList.id);
        if (existingIndex >= 0) {
          merged[existingIndex] = importedList;
          updated++;
        } else {
          merged.push(importedList);
          added++;
        }
      });
      dispatch(setLists(merged));
      setStatus({ type: "success", message: `Merged: ${added} list(s) added, ${updated} list(s) updated.` });
    });
  };

  return (
    <>
      <Helmet>
        <title>Man O'War Fleet Builder | Data</title>
      </Helmet>

      <Header headline="Man O'War Fleet Builder" hasMainNavigation hasHomeButton />

      <Main compact>
        <h2 className="page-headline">Fleet List Data</h2>
        <p>
          Manage your saved fleet lists. You currently have <strong>{lists?.length ?? 0}</strong> list(s) stored.
        </p>

        {status && (
          <p className={`dataset__status dataset__status--${status.type}`}>
            {status.message}
          </p>
        )}

        <div className="dataset__actions">
          <div className="dataset__action">
            <h3>Export</h3>
            <p>Download all your fleet lists as a JSON file.</p>
            <Button onClick={handleExport} disabled={!lists?.length}>
              Export lists
            </Button>
          </div>

          <div className="dataset__action">
            <h3>Import — Merge</h3>
            <p>
              Add lists from a file. Existing lists with matching IDs will be
              overwritten; others will be kept.
            </p>
            <input
              ref={mergeInputRef}
              type="file"
              accept=".json,application/json"
              className="dataset__file-input"
              onChange={handleImportMerge}
            />
            <Button onClick={() => mergeInputRef.current?.click()}>
              Import and merge
            </Button>
          </div>

          <div className="dataset__action">
            <h3>Import — Replace</h3>
            <p>
              Replace <strong>all</strong> current lists with the contents of a
              file. This cannot be undone.
            </p>
            <input
              ref={replaceInputRef}
              type="file"
              accept=".json,application/json"
              className="dataset__file-input"
              onChange={handleImportReplace}
            />
            <Button onClick={() => replaceInputRef.current?.click()} color="secondary">
              Import and replace
            </Button>
          </div>

          <div className="dataset__action">
            <h3>Clear all</h3>
            <p>Permanently delete all saved fleet lists.</p>
            <Button onClick={handleClearAll} color="secondary">
              Clear all lists
            </Button>
          </div>
        </div>
      </Main>
    </>
  );
};
