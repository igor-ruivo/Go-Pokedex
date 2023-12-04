import "./LeaguePicker.scss";
import { LeagueType } from "../hooks/useLeague";
import gameTranslator, { GameTranslatorKeys } from "../utils/GameTranslator";
import { useLanguage } from "../contexts/language-context";

interface ILeaguePickerProps {
    league: LeagueType;
    handleSetLeague: (newLeague: LeagueType) => void;
}

const LeaguePicker = ({league, handleSetLeague}: ILeaguePickerProps) => {
    const { currentGameLanguage } = useLanguage();

    return <nav className="navigation-header ivs-nav extra-gap">
        <ul>
            <li>
                <div onClick={() => handleSetLeague(LeagueType.GREAT_LEAGUE)} className={"header-tab league-picker selectable " + (league === LeagueType.GREAT_LEAGUE ? "selected" : "")}>
                    <img height="32" width="32" src="https://i.imgur.com/JFlzLTU.png" alt="Great League"/>
                    {league === LeagueType.GREAT_LEAGUE && <span>{gameTranslator(GameTranslatorKeys.Great, currentGameLanguage)}</span>}
                </div>
            </li>
            <li>
                <div onClick={() => handleSetLeague(LeagueType.ULTRA_LEAGUE)} className={"header-tab league-picker selectable " + (league === LeagueType.ULTRA_LEAGUE ? "selected" : "")}>
                    <img height="32" width="32" src="https://i.imgur.com/jtA6QiL.png" alt="Ultra League"/>
                    {league === LeagueType.ULTRA_LEAGUE && <span>Ultra</span>}
                </div>
            </li>
            <li>
                <div onClick={() => handleSetLeague(LeagueType.MASTER_LEAGUE)} className={"header-tab league-picker selectable " + (league === LeagueType.MASTER_LEAGUE ? "selected" : "")}>
                    <img height="32" width="32" src="https://i.imgur.com/vJOBwfH.png" alt="Master League"/>
                    {league === LeagueType.MASTER_LEAGUE && <span>{gameTranslator(GameTranslatorKeys.Master, currentGameLanguage)}</span>}
                </div>
            </li>
            <li>
                <div onClick={() => handleSetLeague(LeagueType.CUSTOM_CUP)} className={"header-tab league-picker selectable " + (league === LeagueType.CUSTOM_CUP ? "selected" : "")}>
                    <img height="32" width="32" src="https://i.imgur.com/tkaS5cs.png" alt="Retro Cup"/>
                    {league === LeagueType.CUSTOM_CUP && <span className="league-tooltip">{gameTranslator(GameTranslatorKeys.Retro, currentGameLanguage)}</span>}
                </div>
            </li>
        </ul>
    </nav>;
}

export default LeaguePicker;