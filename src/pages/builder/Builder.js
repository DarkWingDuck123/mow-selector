import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useIntl } from "react-intl";
import { Helmet } from "react-helmet-async";

import { Expandable } from "../../components/expandable";
import { Header, Main } from "../../components/page";
import { RulesetBar } from "../../components/rulesetbar";
import { Button } from "../../components/button";
import { FactionRoster } from "../../components/factionroster";
import { ShowLists } from "../../components/showlists";
import { ListEditor } from "../../components/listeditor";
import { FleetValidator } from "../../components/fleetvalidator";
import { TabBar } from "../../components/tabbar";
import { CardViewer } from "../../components/cardviewer";
import { PrintView } from "../../components/printview";

import "./Builder.css";
import gameSystems from "../../assets/factions.json";
import { fetcher } from "../../utils/fetcher";
import { setFactions } from "../../state/factions";
import { setUnits } from "../../state/units";
import { getAllUnits } from "../../utils/faction";

import "./Builder.css";

export const Builder = () => {
  const location = useLocation();
  const intl = useIntl();
  const dispatch = useDispatch();
  const selectedRuleset = useSelector((state) => state.selectedRuleset);
  const game = gameSystems.find((g) => g.id === selectedRuleset);
  const factions = useSelector((state) => state.factions);
  const units = useSelector((state) => state.units);
  const [selectedListId, setSelectedListId] = useState(null);
  const [bwOverride, setBwOverride] = useState(false);
  // const army = game.armies.find((army) => army.id === list.army);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    setSelectedListId(null);
  }, [selectedRuleset]);

  useEffect(() => {
    game &&
    !factions &&
    fetcher({
      urls: game.nations.map(n => `games/${game.id}/${n.id}`),
      onSuccess: (data) => {
        console.log('loaded urls: ', game.nations.map(n => `games/${game.id}/${n.id}`));
        console.log('value: ', data);
        dispatch(setFactions(data));
      },
      onError: (error) => {
        console.log('error url: ', `games/${game.id}/...`);
        console.log('error value: ', error);
      },
    });
  }, [game, factions, dispatch]);

  useEffect(() => {
    game &&
    factions &&
    !units &&
    fetcher({
      urls: factions.map(f => getAllUnits(f).map(u => `games/${game.id}/${u.id}`)).flat(),
      onSuccess: (data) => {
        console.log('loaded unit urls: ', 'na');
        console.log('unit value: ', data);
        dispatch(setUnits(data));
      },
      onError: (error) => {
        console.log('error unit url: ', 'na');
        console.log('error unit value: ', error);
      },
    });
  }, [game, factions, units, dispatch]);


  return (
    <>
      <Helmet>
        <title>
          {`Man O'War Fleet Builder | ${intl.formatMessage({ id: "footer.about" })}`}
        </title>
      </Helmet>

      <Header headline="Man O'War Fleet Builder" hasMainNavigation hasHomeButton />
      <RulesetBar />

      <Main isDesktop>
        <section className="column">
          <ShowLists selectedListId={selectedListId} onSelectList={setSelectedListId} />
        </section>
        <section className="double__column">
          <TabBar
            tabs={[
              {
                id: "editor",
                label: "Fleet Editor",
                content: (
                  <>
                    <FleetValidator listId={selectedListId} />
                    <ListEditor listId={selectedListId} />
                  </>
                ),
              },
              {
                id: "details",
                label: "Cards",
                content: (
                  <>
                    <PrintView listId={selectedListId} bwOverride={bwOverride} onBwOverride={setBwOverride} />
                    <CardViewer listId={selectedListId} bwOverride={bwOverride} />
                  </>
                ),
              },
            ]}
          />
        </section>
        <section className="column">
          <>
          <FactionRoster listId={selectedListId} />
          </>
        </section>
      </Main>
    </>
  );
};
