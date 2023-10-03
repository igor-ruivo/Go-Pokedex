import { createContext, useContext, useEffect } from 'react';
import { IGamemasterPokemon } from '../DTOs/IGamemasterPokemon';
import { IRankedPokemon } from '../DTOs/IRankedPokemon';
import { FetchData, useFetchUrls } from '../hooks/useFetchUrls';
import { gamemasterPokemonUrl, movesUrl, pvpokeRankings1500Url, pvpokeRankings2500Url, pvpokeRankingsUrl } from '../utils/Resources';
import { mapGamemasterPokemonData, mapMoves, mapRankedPokemon } from '../utils/conversions';
import { IMove } from '../DTOs/IMove';

interface PokemonContextType {
    gamemasterPokemon: IGamemasterPokemon[];
    rankLists: IRankedPokemon[][];
    moves: IMove[];
    fetchCompleted: boolean;
    errors: string
}

const PokemonContext = createContext<PokemonContextType | undefined>(undefined);

const useFetchAllData: () => [IGamemasterPokemon[], IRankedPokemon[][], IMove[], boolean, string] = () => {
    const [gamemasterPokemon, fetchGamemasterPokemon, gememasterPokemonFetchCompleted, errorLoadingGamemasterData]: FetchData<IGamemasterPokemon[]> = useFetchUrls();
    const [rankLists, fetchRankLists, rankListsFetchCompleted, errorLoadingRankListsData]: FetchData<IRankedPokemon[]> = useFetchUrls();
    const [moves, fetchMoves, fetchMovesCompleted, errorLoadingMovesData]: FetchData<IMove[]> = useFetchUrls();

    useEffect(() => {
        const controller = new AbortController();
        fetchGamemasterPokemon([gamemasterPokemonUrl], true, {signal: controller.signal}, mapGamemasterPokemonData);
        fetchRankLists([pvpokeRankings1500Url, pvpokeRankings2500Url, pvpokeRankingsUrl], true, {signal: controller.signal}, mapRankedPokemon);
        fetchMoves([movesUrl], true, {signal: controller.signal}, mapMoves);
        return () => {
            controller.abort("Request canceled by cleanup.");
        }
    }, []);

    return [gamemasterPokemon[0], rankLists, moves[0], gememasterPokemonFetchCompleted && rankListsFetchCompleted && fetchMovesCompleted, errorLoadingGamemasterData + errorLoadingRankListsData + errorLoadingMovesData];
}

export const usePokemon = (): PokemonContextType => {
    const context = useContext(PokemonContext);
    if (!context) {
        throw new Error("usePokemon must be used within a PokemonProvider");
    }
    return context;
};

export const PokemonProvider = (props: React.PropsWithChildren<{}>) => {
    const [gamemasterPokemon, rankLists, moves, fetchCompleted, errors]: [IGamemasterPokemon[], IRankedPokemon[][], IMove[], boolean, string] = useFetchAllData();

    return (
        <PokemonContext.Provider value={{ gamemasterPokemon, rankLists, moves, fetchCompleted, errors }}>
            {props.children}
        </PokemonContext.Provider>
    );
}