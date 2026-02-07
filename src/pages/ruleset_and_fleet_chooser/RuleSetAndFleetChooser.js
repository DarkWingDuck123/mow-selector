import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { FormattedMessage, useIntl } from "react-intl";
import { Helmet } from "react-helmet-async";

import { Expandable } from "../../components/expandable";
import { Header, Main } from "../../components/page";
import { Button } from "../../components/button";

import "./RuleSetAndFleetChooser.css";
import gameSystems from "../../assets/factions.json";

export const RuleSetAndFleetChooser = () => {
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

      {/*<Header headline="Man O'War Fleet Builder" hasMainNavigation hasHomeButton />*/}

      <Main compact>
        <ul>
          {gameSystems.map((sys, index) => (
           <Expandable headline={sys.name}
                       noMargin
                       className="datasets__unit-type datasets__unit"
                       key={index}>
           {/*<pre>{JSON.stringify(sys, null, 2)}</pre>*/}
           {sys.nations.map((nation, index) => (
             <Button
                  type="text"
                  label={nation.id}
                  color="dark"
                  to={"/Builder/"+sys.id+"/"+nation.id+"/new"}>{nation.name_en}</Button>
           ))}              
           {/*<li key={sys.id}>{sys.name}</li>*/}
           </Expandable>
          ))}
        </ul> 
      </Main>
    </>
  );
};
