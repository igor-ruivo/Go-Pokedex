import { Link } from "react-router-dom";
import { IGamemasterPokemon } from "../DTOs/IGamemasterPokemon";
import { usePokemon } from "../contexts/pokemon-context";
import Dictionary from "../utils/Dictionary";
import PokemonImage from "./PokemonImage";
import "./PokemonInfoBanner.scss";
import { useState } from "react";
import LeaguePanels from "./LeaguePanels";
import CircularSliderInput from "./CircularSliderInput";
import React from "react";
import AppraisalBar from "./AppraisalBar";
import { ordinal } from "../utils/conversions";
import { fetchPokemonFamily, fetchReachablePokemonIncludingSelf, sortPokemonByBattlePowerDesc } from "../utils/pokemon-helper";
import translator, { TranslatorKeys } from "../utils/Translator";
import { useLanguage } from "../contexts/language-context";
import { PokemonTypes } from "../DTOs/PokemonTypes";
import movesTranslator, { MovesTranslatorKeys } from "../utils/MovesTranslator";
import PokemonInfoImagePlaceholder from "./PokemonInfoImagePlaceholder";

interface IPokemonInfoBanner {
    pokemon: IGamemasterPokemon;
    ivPercents: Dictionary<IIvPercents>;
    levelCap: number;
    setLevelCap: React.Dispatch<React.SetStateAction<number>>;
    attack: number;
    setAttack: (_: React.SetStateAction<number>) => void;
    defense: number;
    setDefense: (_: React.SetStateAction<number>) => void;
    hp: number;
    setHP: (_: React.SetStateAction<number>) => void;
}

export interface IIvPercents {
    greatLeagueRank: number,
    greatLeagueLvl: number,
    greatLeagueCP: number,
    greatLeagueAttack: number,
    greatLeagueDefense: number,
    greatLeagueHP: number,
    greatLeaguePerfect: any,
    greatLeaguePerfectLevel: number,
    greatLeaguePerfectCP: number,
    ultraLeagueRank: number,
    ultraLeagueLvl: number,
    ultraLeagueCP: number,
    ultraLeagueAttack: number,
    ultraLeagueDefense: number,
    ultraLeagueHP: number,
    ultraLeaguePerfect: any,
    ultraLeaguePerfectLevel: number,
    ultraLeaguePerfectCP: number,
    masterLeagueRank: number,
    masterLeagueLvl: number,
    masterLeagueCP: number,
    masterLeagueAttack: number,
    masterLeagueDefense: number,
    masterLeagueHP: number,
    masterLeaguePerfect: any,
    masterLeaguePerfectLevel: number,
    masterLeaguePerfectCP: number
}

const PokemonInfoBanner = ({pokemon, ivPercents, levelCap, setLevelCap, attack, setAttack, defense, setDefense, hp, setHP}: IPokemonInfoBanner) => {
    const [displayLevel, setDisplayLevel] = useState(levelCap);
    const {currentLanguage} = useLanguage();
    const selectedImageRef = React.createRef<HTMLImageElement>();

    const {gamemasterPokemon, rankLists, moves, fetchCompleted} = usePokemon();

    if (!fetchCompleted || !pokemon || !gamemasterPokemon || !moves || Object.keys(moves).length === 0 || rankLists.length === 0 || Object.keys(ivPercents).length === 0) {
        return <></>;
    }

    const similarPokemon = fetchPokemonFamily(pokemon, gamemasterPokemon);
    
    const valueToLevel = (value: number) => {
        return value / 2 + 0.5
    }

    let bestInFamilyForGreatLeague = pokemon;
    let bestInFamilyForGreatLeagueRank = Number.MAX_VALUE;
    let bestInFamilyForUltraLeague = pokemon;
    let bestInFamilyForUltraLeagueRank = Number.MAX_VALUE;
    let bestInFamilyForMasterLeague = pokemon;
    let bestInFamilyForMasterLeagueRank = Number.MAX_VALUE;

    const reachablePokemons = fetchReachablePokemonIncludingSelf(pokemon, gamemasterPokemon);

    reachablePokemons.forEach(member => {
        const rankInGreat = rankLists[0][member.speciesId]?.rank;
        const rankInUltra = rankLists[1][member.speciesId]?.rank;
        const rankInMaster = rankLists[2][member.speciesId]?.rank;
        if (!isNaN(rankInGreat) && rankInGreat < bestInFamilyForGreatLeagueRank) {
            bestInFamilyForGreatLeagueRank = rankInGreat;
            bestInFamilyForGreatLeague = member;
        }
        if (!isNaN(rankInUltra) && rankInUltra < bestInFamilyForUltraLeagueRank) {
            bestInFamilyForUltraLeagueRank = rankInUltra;
            bestInFamilyForUltraLeague = member;
        }
        if (!isNaN(rankInMaster) && rankInMaster < bestInFamilyForMasterLeagueRank) {
            bestInFamilyForMasterLeagueRank = rankInMaster;
            bestInFamilyForMasterLeague = member;
        }
    });

    const bestReachableGreatLeagueIvs = ivPercents[bestInFamilyForGreatLeague.speciesId];
    const bestReachableUltraLeagueIvs = ivPercents[bestInFamilyForUltraLeague.speciesId];
    const bestReachableMasterLeagueIvs = ivPercents[bestInFamilyForMasterLeague.speciesId];

    const greatLeagueMoveset = rankLists[0][bestInFamilyForGreatLeague.speciesId]?.moveset ?? [];
    const ultraLeagueMoveset = rankLists[1][bestInFamilyForUltraLeague.speciesId]?.moveset ?? [];
    const masterLeagueMoveset = rankLists[2][bestInFamilyForMasterLeague.speciesId]?.moveset ?? [];

    const getRankPercentage = (rank: number) => Math.round(((1 - (rank / 4095)) * 100 + Number.EPSILON) * 100) / 100;

    const translatedType = (type: PokemonTypes) => {
        const translatorKey = TranslatorKeys[type];
        return translator(translatorKey as any, currentLanguage)
    }

    const translatedMove = (move: string) => {
        const translatorKey = MovesTranslatorKeys[move as keyof typeof MovesTranslatorKeys];
        return movesTranslator(translatorKey ?? move, currentLanguage);
    }

    return <>
        <PokemonInfoImagePlaceholder
            pokemon={pokemon}
            computedCP={ivPercents[pokemon.speciesId].masterLeagueCP}
            computedAtk={+(Math.trunc(ivPercents[pokemon.speciesId].masterLeagueAttack * 10) / 10).toFixed(1)}
            computedDef={+(Math.trunc(ivPercents[pokemon.speciesId].masterLeagueDefense * 10) / 10).toFixed(1)}
            computedHP={ivPercents[pokemon.speciesId].masterLeagueHP}
            displayLevel={displayLevel}
            setDisplayLevel={(newLevel: number) => {setDisplayLevel(newLevel); setLevelCap(newLevel);}}
            imageRef={selectedImageRef}
        />
        <AppraisalBar
            attack = {attack}
            setAttack={setAttack}
            defense={defense}
            setDefense={setDefense}
            hp={hp}
            setHP={setHP}
        />
        {similarPokemon.size > 1 && <div className="img-container">
            <div className="img-family">
                {Array.from(similarPokemon).sort(sortPokemonByBattlePowerDesc).map(p => (
                    <div key = {p.speciesId} className="img-family-container">
                        <Link to={`/pokemon/${p.speciesId}/info`}>
                            <PokemonImage pokemon={p} withName={false}/>
                        </Link>
                    </div>
                ))}
            </div>
        </div>}
        <LeaguePanels
            greatLeagueStats={
                {
                    leagueTitle: "great",
                    bestReachablePokemonName: bestInFamilyForGreatLeague.speciesShortName,
                    pokemonRankInLeague: ordinal(rankLists[0][bestInFamilyForGreatLeague.speciesId]?.rank),
                    pokemonLeaguePercentage: getRankPercentage(bestReachableGreatLeagueIvs.greatLeagueRank),
                    pokemonLeaguePercentile: bestReachableGreatLeagueIvs.greatLeagueRank + 1,
                    pokemonCP: bestReachableGreatLeagueIvs.greatLeagueCP,
                    pokemonLevel: bestReachableGreatLeagueIvs.greatLeagueLvl,
                    atk: bestReachableGreatLeagueIvs.greatLeaguePerfect.A,
                    def: bestReachableGreatLeagueIvs.greatLeaguePerfect.D,
                    hp: bestReachableGreatLeagueIvs.greatLeaguePerfect.S,
                    bestCP: bestReachableGreatLeagueIvs.greatLeaguePerfectCP,
                    bestLevel: bestReachableGreatLeagueIvs.greatLeaguePerfectLevel,
                    fastAttack: {
                        moveName: translatedMove(moves[greatLeagueMoveset[0]]?.moveId),
                        type: moves[greatLeagueMoveset[0]]?.type,
                        isElite: bestInFamilyForGreatLeague.eliteMoves.includes(greatLeagueMoveset[0]),
                        isLegacy: bestInFamilyForGreatLeague.legacyMoves.includes(greatLeagueMoveset[0])
                    },
                    chargedAttack1: {
                        moveName: translatedMove(moves[greatLeagueMoveset[1]]?.moveId),
                        type: moves[greatLeagueMoveset[1]]?.type,
                        isElite: bestInFamilyForGreatLeague.eliteMoves.includes(greatLeagueMoveset[1]),
                        isLegacy: bestInFamilyForGreatLeague.legacyMoves.includes(greatLeagueMoveset[1])
                    },
                    chargedAttack2: {
                        moveName: translatedMove(moves[greatLeagueMoveset[2]]?.moveId),
                        type: moves[greatLeagueMoveset[2]]?.type,
                        isElite: bestInFamilyForGreatLeague.eliteMoves.includes(greatLeagueMoveset[2]),
                        isLegacy: bestInFamilyForGreatLeague.legacyMoves.includes(greatLeagueMoveset[2])
                    }
                }
            }
            ultraLeagueStats={
                {
                    leagueTitle: "ultra",
                    bestReachablePokemonName: bestInFamilyForUltraLeague.speciesShortName,
                    pokemonRankInLeague: ordinal(rankLists[1][bestInFamilyForUltraLeague.speciesId]?.rank),
                    pokemonLeaguePercentage: getRankPercentage(bestReachableUltraLeagueIvs.ultraLeagueRank),
                    pokemonLeaguePercentile: bestReachableUltraLeagueIvs.ultraLeagueRank + 1,
                    pokemonCP: bestReachableUltraLeagueIvs.ultraLeagueCP,
                    pokemonLevel: bestReachableUltraLeagueIvs.ultraLeagueLvl,
                    atk: bestReachableUltraLeagueIvs.ultraLeaguePerfect.A,
                    def: bestReachableUltraLeagueIvs.ultraLeaguePerfect.D,
                    hp: bestReachableUltraLeagueIvs.ultraLeaguePerfect.S,
                    bestCP: bestReachableUltraLeagueIvs.ultraLeaguePerfectCP,
                    bestLevel: bestReachableUltraLeagueIvs.ultraLeaguePerfectLevel,
                    fastAttack: {
                        moveName: translatedMove(moves[ultraLeagueMoveset[0]]?.moveId),
                        type: moves[ultraLeagueMoveset[0]]?.type,
                        isElite: bestInFamilyForUltraLeague.eliteMoves.includes(ultraLeagueMoveset[0]),
                        isLegacy: bestInFamilyForUltraLeague.legacyMoves.includes(ultraLeagueMoveset[0])
                    },
                    chargedAttack1: {
                        moveName: translatedMove(moves[ultraLeagueMoveset[1]]?.moveId),
                        type: moves[ultraLeagueMoveset[1]]?.type,
                        isElite: bestInFamilyForUltraLeague.eliteMoves.includes(ultraLeagueMoveset[1]),
                        isLegacy: bestInFamilyForUltraLeague.legacyMoves.includes(ultraLeagueMoveset[1])
                    },
                    chargedAttack2: {
                        moveName: translatedMove(moves[ultraLeagueMoveset[2]]?.moveId),
                        type: moves[ultraLeagueMoveset[2]]?.type,
                        isElite: bestInFamilyForUltraLeague.eliteMoves.includes(ultraLeagueMoveset[2]),
                        isLegacy: bestInFamilyForUltraLeague.legacyMoves.includes(ultraLeagueMoveset[2])
                    }
                }
            }
            masterLeagueStats={
                {
                    leagueTitle: "master",
                    bestReachablePokemonName: bestInFamilyForMasterLeague.speciesShortName,
                    pokemonRankInLeague: ordinal(rankLists[2][bestInFamilyForMasterLeague.speciesId]?.rank),
                    pokemonLeaguePercentage: getRankPercentage(bestReachableMasterLeagueIvs.masterLeagueRank),
                    pokemonLeaguePercentile: bestReachableMasterLeagueIvs.masterLeagueRank + 1,
                    pokemonCP: bestReachableMasterLeagueIvs.masterLeagueCP,
                    pokemonLevel: bestReachableMasterLeagueIvs.masterLeagueLvl,
                    atk: bestReachableMasterLeagueIvs.masterLeaguePerfect.A,
                    def: bestReachableMasterLeagueIvs.masterLeaguePerfect.D,
                    hp: bestReachableMasterLeagueIvs.masterLeaguePerfect.S,
                    bestCP: bestReachableMasterLeagueIvs.masterLeaguePerfectCP,
                    bestLevel: bestReachableMasterLeagueIvs.masterLeaguePerfectLevel,
                    fastAttack: {
                        moveName: translatedMove(moves[masterLeagueMoveset[0]]?.moveId),
                        type: moves[masterLeagueMoveset[0]]?.type,
                        isElite: bestInFamilyForMasterLeague.eliteMoves.includes(masterLeagueMoveset[0]),
                        isLegacy: bestInFamilyForMasterLeague.legacyMoves.includes(masterLeagueMoveset[0])
                    },
                    chargedAttack1: {
                        moveName: translatedMove(moves[masterLeagueMoveset[1]]?.moveId),
                        type: moves[masterLeagueMoveset[1]]?.type,
                        isElite: bestInFamilyForMasterLeague.eliteMoves.includes(masterLeagueMoveset[1]),
                        isLegacy: bestInFamilyForMasterLeague.legacyMoves.includes(masterLeagueMoveset[1])
                    },
                    chargedAttack2: {
                        moveName: translatedMove(moves[masterLeagueMoveset[2]]?.moveId),
                        type: moves[masterLeagueMoveset[2]]?.type,
                        isElite: bestInFamilyForMasterLeague.eliteMoves.includes(masterLeagueMoveset[2]),
                        isLegacy: bestInFamilyForMasterLeague.legacyMoves.includes(masterLeagueMoveset[2])
                    }
                }
            }
        />
    </>;
}

export default PokemonInfoBanner;