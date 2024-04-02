import './calendar.scss';
import LoadingRenderer from '../components/LoadingRenderer';
import { usePokemon } from '../contexts/pokemon-context';
import { useLanguage } from '../contexts/language-context';
import { useCalendar } from '../contexts/raid-bosses-context';
import PokemonCard from '../components/PokemonCard';
import { ListType } from './pokedex';
import { calculateCP, levelToLevelIndex } from '../utils/pokemon-helper';
import gameTranslator, { GameTranslatorKeys } from '../utils/GameTranslator';
import translator, { TranslatorKeys } from '../utils/Translator';
import { Link, useLocation } from 'react-router-dom';
import { IEntry, IPostEntry } from '../DTOs/INews';
import { useState } from 'react';
import useCountdown from '../hooks/useCountdown';


const getDateKey = (obj: IPostEntry) => String(obj?.date?.valueOf()) + "-" + String(obj?.dateEnd?.valueOf());

const inUpperCase = (str: string) => str?.substring(0, 1)?.toUpperCase() + str?.substring(1);

const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    weekday: 'short',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: false
}

const computeCount = (d: number, h: number, m: number, s: number) => {
    if (!d && !h && !m && !s) {
        return "Expired";
    }

    return d > 0 ? `${d} day${d > 1 ? "s" : ""} left` : `${h}h : ${m}m : ${s}s`;
}

const Calendar = () => {
    const { gamemasterPokemon, fetchCompleted, errors } = usePokemon();
    const { bossesPerTier, posts, season, leekPosts, seasonFetchCompleted, seasonErrors, bossesFetchCompleted, postsFetchCompleted, leekPostsFetchCompleted, leekPostsErrors, bossesErrors, postsErrors } = useCalendar();
    const { pathname } = useLocation();
    
    const {days, hours, minutes, seconds} = useCountdown(season?.dateEnd ?? 0);

    const {currentGameLanguage, currentLanguage} = useLanguage();
    const [currentPlace, setCurrentPlace] = useState("0");

    const computeString = (kind: string | undefined, isShadow: boolean) => {
        if (!kind) {
            return undefined;
        }

        if (kind.toLocaleLowerCase().includes("mega")) {
            return "Mega Raid";
        }
/*
        if (kind.toLocaleLowerCase().includes("shadow")) {
            return "Shadow Raid";
        }*/

        return `Tier ${kind}${isShadow && !kind.toLocaleLowerCase().includes("shadow") ? " Shadow" : ""}`;
    }

    const getMega = (speciesId: string) => {
        const original = gamemasterPokemon[speciesId];
        return Object.values(gamemasterPokemon).find(p => p.dex === original.dex && !p.aliasId && p.isMega);
    }

    const pokemonBasePath = pathname.substring(0, pathname.lastIndexOf("/"));
    const tab = pathname.substring(pathname.lastIndexOf("/"));

    const reducedLeekPosts = Object.entries(leekPosts
        .reduce((acc: { [key: string]: IPostEntry }, obj) => {
            const key = getDateKey(obj);
            // If the key already exists in the accumulator, merge 'entries'
            if (acc[key]) {
              acc[key].entries = [...acc[key].entries, ...obj.entries];
            } else {
              // Otherwise, initialize it with the current object (ignoring 'kind' or keeping it arbitrarily)
              acc[key] = { date: obj.date, dateEnd: obj.dateEnd, entries: obj.entries };
            }
            return acc;
          }, {}))
          .map(([key, value]) => ({
            date: value.date,
            dateEnd: value.dateEnd,
            entries: value.entries
          } as IPostEntry))
        .filter(p => p.entries.length > 0 && new Date(p.dateEnd ?? 0) >= new Date());

    const reducedRaids = posts.filter(p => p["raids"]?.entries.length > 0 && new Date(p["raids"]?.dateEnd ?? 0) >= new Date());

    const sortEntries = (e1: IEntry, e2: IEntry) => {
        if (gamemasterPokemon[e1.speciesId].isShadow && !gamemasterPokemon[e2.speciesId].isShadow) {
            return 1;
        }

        if (gamemasterPokemon[e1.speciesId].isShadow && !gamemasterPokemon[e2.speciesId].isShadow) {
            return -1;
        }

        if (e1.kind === e2.kind) {
            return gamemasterPokemon[e1.speciesId].dex - gamemasterPokemon[e2.speciesId].dex;
        }

        if (!e1.kind) {
            return -1;
        }

        if (!e2.kind) {
            return 1;
        }

        return e1.kind.localeCompare(e2.kind);
    }

    const generateTodayBosses = (entries: IPostEntry[]) => {
        if (!bossesFetchCompleted || !leekPostsFetchCompleted || !postsFetchCompleted) {
            return [];
        }

        const seenIds = new Set<string>(bossesPerTier.entries.map(e => e.speciesId));
        const response = [...bossesPerTier.entries];

        const now = new Date();
        /*const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const left = new Date(currentYear, currentMonth, currentDay, 0, 0);
        const right = new Date(currentYear, currentMonth, currentDay, 0, 0);
        right.setDate(right.getDate() + 1);*/

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const dateEntryStart = new Date(entry.date);
            const dateEntryEnd = new Date(entry.dateEnd ?? 0);

            if (!(now >= dateEntryStart && now < dateEntryEnd)) {
                continue;
            }
            
            for (let j = 0; j < entry.entries.length; j++) {
                const p = entry.entries[j];
                if (seenIds.has(p.speciesId)) {
                    continue;
                }

                seenIds.add(p.speciesId);

                response.push({
                    speciesId: p.speciesId,
                    shiny: p.shiny,
                    kind: p.kind
                });
            }
        }

        return response.sort(sortEntries);
    }

    const additionalBosses = [...reducedLeekPosts, ...reducedRaids.map(r => r["raids"])];

    const bossesAvailableToday = generateTodayBosses(additionalBosses);
    
    const sortPosts = (e1: IPostEntry, e2: IPostEntry) => {
        if (e1.date.valueOf() === e2.date.valueOf()) {
            return (e1.dateEnd?.valueOf() ?? 0) - (e2.dateEnd?.valueOf() ?? 0);
        }

        return e1.date.valueOf() - e2.date.valueOf();
    }

    const remainingBosses = additionalBosses
    .filter(e => e.entries.length > 0 && !e.entries.every(c => bossesAvailableToday.map(n => n.speciesId).includes(c.speciesId)))
    .sort(sortPosts);

    const idxToPlace = (idx: number) => {
        switch(idx) {
            case 0:
                return "Cities";
            case 1:
                return "Forests";
            case 2:
                return "Mountains";
            case 3:
                return "Beaches & Water";
            case 4:
                return "Northen Hemisphere";
            case 5:
                return "Southern Hemisphere";
        }
    }
    
    const idxToRes = (idx: number) => {
        switch(idx) {
            case 0:
                return "City";
            case 1:
                return "Forest";
            case 2:
                return "Mountain";
            case 3:
                return "Water";
            case 4:
                return "North";
            case 5:
                return "South";
        }
    }

    return (
        <main className="layout">
            <nav className="navigation-header">
                <ul>
                    <li>
                        <Link to={pokemonBasePath + "/bosses"} className={"header-tab " + (tab.endsWith("/bosses") ? "selected" : "")}>
                            <span>Bosses</span>
                        </Link>
                    </li>
                    <li>
                        <Link to={pokemonBasePath + "/spawns"} className={"header-tab " + (tab.endsWith("/spawns") ? "selected" : "")}>
                            <span>Spawns</span>
                        </Link>
                    </li>
                    <li>
                        <Link to={pokemonBasePath + "/rockets"} className={"header-tab disabled " + (tab.endsWith("/rockets") ? "selected" : "")}>
                            <span>Rockets</span>
                        </Link>
                    </li>
                    <li>
                        <Link to={pokemonBasePath + "/eggs"} className={"header-tab disabled " + (tab.endsWith("/eggs") ? "selected" : "")}>
                            <span>Eggs</span>
                        </Link>
                    </li>
                </ul>
            </nav>
            <div className="pokemon">
                <LoadingRenderer errors={errors + bossesErrors + postsErrors + seasonErrors + leekPostsErrors} completed={fetchCompleted && bossesFetchCompleted && postsFetchCompleted && seasonFetchCompleted && leekPostsFetchCompleted}>
                <div className="calendar-content">
                        <div className="pokemon with-normal-gap">
                            {tab.endsWith("/bosses") && bossesFetchCompleted && leekPostsFetchCompleted && postsFetchCompleted && <div><h1 className='centered-text with-side-margin item default-padding'>
                                Current Bosses
                                </h1><div className='with-flex'>{bossesAvailableToday.map(e => 
                                    <div className="card-wrapper-padding dynamic-size" key={e.speciesId}>
                                        <div className={`card-wrapper ${e.kind === "mega" || e.kind?.includes("5") || e.kind?.includes("6") ? "with-golden-border" : ""}`}>
                                            <PokemonCard pokemon={e.speciesId.includes("mega") ? getMega(e.speciesId) ?? gamemasterPokemon[e.speciesId] : gamemasterPokemon[e.speciesId]} listType={ListType.POKEDEX} shinyBadge={e.shiny} cpStringOverride={computeString(e.kind, gamemasterPokemon[e.speciesId].isShadow)} withCountdown={additionalBosses.sort(sortPosts).find(d => d.date <= new Date().valueOf() && d.entries.some(f => f.speciesId === e.speciesId))?.dateEnd} />
                                        </div>
                                    </div>)}
                                </div>
                            </div>}
                            {tab.endsWith("/bosses") && leekPostsFetchCompleted && postsFetchCompleted &&
                            remainingBosses
                            .map(e => <div key={getDateKey(e)}>
                                <h4 className='centered-text item default-padding with-side-margin'>
                                    {inUpperCase(new Date(e.date).toLocaleString(undefined, options))} - {inUpperCase(new Date(e.dateEnd ?? 0).toLocaleString(undefined, options))}
                                </h4>
                                <div className='with-flex'>
                                {e.entries.sort(sortEntries).map(p => <div key={p.speciesId} className="card-wrapper-padding dynamic-size">
                                    <div className={`card-wrapper ${p.kind === "mega" || p.kind?.includes("5") || p.kind?.includes("6") ? "with-golden-border" : ""}`}>
                                        <PokemonCard pokemon={gamemasterPokemon[p.speciesId]} listType={ListType.POKEDEX} cpStringOverride={computeString(p.kind, gamemasterPokemon[p.speciesId].isShadow)}/>
                                    </div>
                                </div>)}
                                </div>
                            </div>)}
                            {tab.endsWith("/spawns") && postsFetchCompleted && seasonFetchCompleted && posts.map(p => p["wild"]).filter(p => p && p.entries.length > 0 && new Date(p.dateEnd ?? 0) >= new Date() && new Date(p.date) < new Date()).sort(sortPosts).map(e => <PostEntry key={getDateKey(e)} post={e} sortEntries={sortEntries}/>)}
                            {tab.endsWith("/spawns") && postsFetchCompleted && seasonFetchCompleted && <div>
                                <div>
                                <div><h1 className='centered-text with-side-margin item default-padding'>Current Season <span className="computeCount">({computeCount(days, hours, minutes, seconds)})</span></h1></div>
                                <div className="raid-container">
                                    <div className="overflowing">
                                        <div className="img-family">
                                            {[season.entries.filter(e => e.kind === "0"), season.entries.filter(e => e.kind === "1"), season.entries.filter(e => e.kind === "2"), season.entries.filter(e => e.kind === "3"), season.entries.filter(e => e.kind === "4"), season.entries.filter(e => e.kind === "5")]
                                            .map((t, i) => (
                                                <div className="clickable" key={i} onClick={() => setCurrentPlace(String(i))}>
                                                    <strong className={`move-detail ${String(i) === currentPlace ? "soft" : "baby-soft"} normal-padding item ${String(i) === currentPlace ? "extra-padding-right" : ""}`}>
                                                        <div className="img-padding"><img className="invert-light-mode" height={26} width={26} alt="type" src={`${process.env.PUBLIC_URL}/images/${idxToRes(i)}.png`}/></div>
                                                        {String(i) === currentPlace && idxToPlace(i)}
                                                    </strong>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div></div>
                                <div className='with-flex'>
                                    {season.entries.filter(r => r.kind === currentPlace).sort(sortEntries).map(p => <div key={p.speciesId} className="card-wrapper-padding dynamic-size">
                                        <div className={`card-wrapper`}>
                                            <PokemonCard pokemon={gamemasterPokemon[p.speciesId]} listType={ListType.POKEDEX} />
                                        </div>
                                    </div>)}
                                </div>
                            </div>}
                            {tab.endsWith("/spawns") && postsFetchCompleted && seasonFetchCompleted && posts.map(p => p["wild"]).filter(p => p && p.entries.length > 0 && new Date(p.dateEnd ?? 0) >= new Date() && new Date(p.date) > new Date()).sort(sortPosts).map(e => <PostEntry key={getDateKey(e)} post={e} sortEntries={sortEntries}/>)}
                        </div>
                </div>
                </LoadingRenderer>
            </div>
        </main>
    );
}
export default Calendar;

interface IPost {
    post: IPostEntry;
    sortEntries: (e1: IEntry, e2: IEntry) => number;
}

const PostEntry = ({post, sortEntries}: IPost) => {
    const {gamemasterPokemon} = usePokemon();
    const {days, hours, minutes, seconds} = useCountdown(post.dateEnd ?? 0);

    const now = new Date();
    const postIsNow = now > new Date(post.date) && now < new Date(post.dateEnd ?? 0);

    return <div>
        {postIsNow && <><h1 className='centered-text with-side-margin item default-padding'>Current Spawns</h1><h4>({computeCount(days, hours, minutes, seconds)})</h4></>}
        {!postIsNow && <h4 className='centered-text with-side-margin item default-padding'>{inUpperCase(new Date(post.date).toLocaleString(undefined, options)) + " - " + inUpperCase(new Date(post.dateEnd ?? 0).toLocaleString(undefined, options))}</h4>}
        <div className='with-flex'>
        {post.entries.sort(sortEntries).map(p => <div key={p.speciesId} className="card-wrapper-padding dynamic-size">
            <div className={`card-wrapper ${p.kind === "mega" || p.kind?.includes("5") || p.kind?.includes("6") ? "with-golden-border" : ""}`}>
                <PokemonCard pokemon={gamemasterPokemon[p.speciesId]} listType={ListType.POKEDEX} />
            </div>
        </div>)}
        </div>
    </div>
    
}