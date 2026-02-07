import { useState, useEffect } from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import { useLocation, Link } from "react-router-dom";
import { useIntl } from "react-intl";

import { Button } from "../../components/button";

import "./Header.css";

export const Header = ({
  className,
  headline,
  headlineIcon,
  subheadline,
  moreButton,
  to,
  isSection,
  hasPointsError,
  hasMainNavigation,
  navigationIcon,
  hasHomeButton,
  filters,
}) => {
  const intl = useIntl();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const Component = isSection ? "section" : "header";
  const handleMenuClick = () => {
    setShowMenu(!showMenu);
  };

  const navigationLinks = [
    {
      name: intl.formatMessage({
        id: "footer.about",
      }),
      to: "/about",
      icon: "about",
    },
    {
      name: intl.formatMessage({
        id: "footer.help",
      }),
      to: "/help",
      icon: "help",
    },
    {
      name: intl.formatMessage({
        id: "footer.datasets",
      }),
      to: "/datasets",
      icon: "datasets",
    },
    {
      name: intl.formatMessage({
        id: "footer.changelog",
      }),
      to: "/changelog",
      icon: "news",
    },
 ];

 let navigation = navigationLinks;

//  const navigation = hasMainNavigation ? navigationLinks : moreButton;

  useEffect(() => {
    setShowMenu(false);
  }, [location.pathname]);

  return (
    <Component
      className={classNames(isSection ? "column-header" : "header", className)}
    >
      <Button
        type="text"
        to="/"
        label="Homeish"
        color="dark"
        icon="home"
      />
      <h1 className="header__name">
        <Link className="header__name-link" to="/">
          Man O'War Fleet Builder
        </Link>
     </h1>
     <Button
        type="text"
        label="navigate"
        color="dark"
        icon="menu"
        onClick={handleMenuClick}
     />
     {showMenu && navigation && (
       <ul
         className={classNames(
            "header__more",
            "header__more--secondary-navigation"
        )}
      >
      {navigation.map(({ callback, name, icon, to: moreButtonTo }) => (
        <li key={name}>
          <Button
            type="text"
            label={name}
            color="dark"
            onClick={callback}
            to={moreButtonTo}
            icon={icon}
            >
              {name}
           </Button>
         </li>
       ))}
       </ul>
      )}
    </Component>
  );
};

Header.propTypes = {
  className: PropTypes.string,
  to: PropTypes.string,
  headline: PropTypes.string,
  headlineIcon: PropTypes.node,
  subheadline: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  children: PropTypes.node,
  moreButton: PropTypes.array,
  filters: PropTypes.array,
  isSection: PropTypes.bool,
  hasPointsError: PropTypes.bool,
  hasMainNavigation: PropTypes.bool,
  hasHomeButton: PropTypes.bool,
  navigationIcon: PropTypes.string,
};
