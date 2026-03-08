import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useIntl } from "react-intl";
import { useSelector } from "react-redux";
import { Helmet } from "react-helmet-async";

import { Main } from "../../components/page";
import { Button } from "../../components/button";

import "./RuleSetAndFleetChooser.css";
import gameSystems from "../../assets/factions.json";

export const RuleSetAndFleetChooser = () => {
  const location = useLocation();
  const intl = useIntl();
  const selectedRuleset = useSelector((state) => state.selectedRuleset);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const activeSystem = gameSystems.find((sys) => sys.id === selectedRuleset);

  return (
    <>
      <Helmet>
        <title>
          {`Man O'War Fleet Builder | ${intl.formatMessage({ id: "footer.about" })}`}
        </title>
      </Helmet>

      <Main compact>
        {activeSystem && (
          <ul className="fleet-chooser__nations">
            {activeSystem.nations.map((nation) => (
              <li key={nation.id}>
                <Button
                  type="text"
                  label={nation.id}
                  color="dark"
                  to={"/Builder/" + activeSystem.id + "/" + nation.id + "/new"}
                >
                  {nation.name_en}
                </Button>
              </li>
            ))}
            {activeSystem.nations.length === 0 && (
              <li className="fleet-chooser__empty">Coming soon</li>
            )}
          </ul>
        )}
      </Main>
    </>
  );
};
