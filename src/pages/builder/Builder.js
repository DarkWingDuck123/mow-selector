import { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useIntl } from "react-intl";
import { Helmet } from "react-helmet-async";

import { Expandable } from "../../components/expandable";
import { Header, Main } from "../../components/page";
import { Button } from "../../components/button";
import { FactionRoster } from "../../components/factionroster";
import { ShowLists } from "../../components/showlists";
import { ListEditor } from "../../components/listeditor";

import "./Builder.css";
import gameSystems from "../../assets/factions.json";
import { fetcher } from "../../utils/fetcher";
import { setFactions } from "../../state/factions";
import { setUnits } from "../../state/units";

import "./Builder.css";

export const Builder = () => {
  const location = useLocation();
  const intl = useIntl();
  const { ruleset, listId } = useParams();
  const dispatch = useDispatch();
  const game = gameSystems.find((game) => game.id === ruleset);
  const factions = useSelector((state) => state.factions);
  const units = useSelector((state) => state.units);
  // const army = game.armies.find((army) => army.id === list.army);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    game &&
    !factions &&
    fetcher({
      urls: game.nations.map(n => `games/${game.id}/${n.id}/${n.id}`),
      onSuccess: (data) => {
        console.log('loaded urls: ', game.nations.map(n => `games/${game.id}/${n.id}/${n.id}`));
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
      urls: factions.map(f => f.units.map(u => `games/${game.id}/${f.id}/${u.id}`)).flat(),
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

      <Main isDesktop>
        <section className="column">
          <ShowLists />
        </section>
        <section className="double__column">
        <ul>
          <ListEditor listId={listId} /> 
          <h3>Woot</h3>
          <li>ruleset: {ruleset}</li>
          <li>listId: {listId}</li>
          {<pre>{JSON.stringify(factions, null, 2)}</pre>}
          {<pre>{JSON.stringify(game, null, 2)}</pre>}
          
          {gameSystems.map((sys, index) => (
           <Expandable headline={sys.name}
                       noMargin
                       className="datasets__unit-type datasets__unit"
                       key={index}>
           {sys.nations.map((nation, index) => (
             <Button
                  type="text"
                  label={nation.id}
                  color="dark"
                  to={"/Builder/"+sys.id+"/lid"}>{nation.name_en}</Button>
           ))}              
           </Expandable>
          ))}
        </ul> 
        </section>
        <section className="column">
          <>
          <FactionRoster className="foo" listId={listId}></FactionRoster>
          </>
        </section>
      </Main>
    </>
  );
};
