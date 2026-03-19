import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useIntl } from "react-intl";
import { Helmet } from "react-helmet-async";
import { Header, Main } from "../../components/page";
import { Button } from "../../components/button";
import { ShowLists } from "../../components/showlists";

import gameSystems from "../../assets/factions.json";

import "./RuleSetChooser.css";

export const RuleSetChooser = () => {
  const location = useLocation();
  const intl = useIntl();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>
          {`Man O'War Fleet Builder | ${intl.formatMessage({ id: "footer.about" })}`}
        </title>
      </Helmet>

      <Header headline="Man O'War Fleet Builder" hasMainNavigation hasHomeButton />

      <Main isDesktop>
        <section className="column">
          <ShowLists />
        </section>
        <section className="double__column">
          <h2>RuleSets:</h2>
          {gameSystems.map((sys, index) => (
            <>
              <Button
                type="text"
                size="small"
                label={sys.id}
                color="dark"
                onClick={() => { console.log("clicked", sys.id) }}
                to="/Builder">
                {sys.name_en}
              </Button>
              <br/>
            </>
          ))}
        </section>
        <section className="column">
        </section>
      </Main>
    </>
  );
};
