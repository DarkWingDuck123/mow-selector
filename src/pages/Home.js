import DOMPurify from "dompurify";
import { Link } from "react-router-dom";
import { Main } from "../components/page";
import homeData from "../assets/home.json";
import gameSystems from "../assets/factions.json";

import "./Home.css";

const Home = () => {
  return (
    <Main compact>
      <h1 className="home__title">{homeData.description_title_en}</h1>
      <div
        className="home__description"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(homeData.description_en) }}
      />

      <h2 className="home__section-title">{homeData.rulesets_title_en}</h2>
      <ul className="home__rulesets">
        {gameSystems.map((sys) => (
          <li key={sys.id} className="home__ruleset">
            <h3 className="home__ruleset-name">{sys.name_en}</h3>
            <div className="home__ruleset-description" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sys.description_en) }} />
          </li>
        ))}
      </ul>

      <h2 className="home__section-title">Tools:</h2>
      <ul className="home__tools">
        <li><Link to="/CardBuilder" className="home__tool-link">Card Builder</Link> — create and edit card JSON files</li>
        <li><Link to="/FactionBuilder" className="home__tool-link">Faction Builder</Link> — create and edit faction JSON files</li>
      </ul>

      <h2 className="home__section-title">{homeData.new_title_en}</h2>
      <ul className="home__news">
        {homeData.news.map((item, i) => (
          <li key={i} className="home__news-item">
            <span className="home__news-date">{item.date_en}</span>
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.announcement_en) }} />
          </li>
        ))}
      </ul>

      <h2 className="home__section-title">{homeData.known_bugs_title_en}</h2>
      <ul className="home__bugs">
        {homeData.bugs.map((bug, i) => (
          <li key={i}>{bug.description}</li>
        ))}
      </ul>
    </Main>
  );
};

export default Home;
