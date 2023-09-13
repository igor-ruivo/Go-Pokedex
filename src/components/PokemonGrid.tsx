import { memo, useCallback, useEffect, useRef, useState } from 'react';
import "./PokemonGrid.scss"
import { IGamemasterPokemon } from '../DTOs/IGamemasterPokemon';

interface IPokemonGridProps {
    pokemonInfoList: IGamemasterPokemon[]
}

const PokemonGrid = memo(({pokemonInfoList}: IPokemonGridProps) => {
    const batchSize = 12;
    const bufferSize = 3 * batchSize;
    const scrollHeightLimit = 200;

    const [lastShownIndex, setLastShownIndex] = useState(0);
    const [globalImgData, setGlobalImgData] = useState(new Map<string, boolean>());

    const pokemonImagesAlreadyFetched = useRef(new Set<string>());
    const renderDivRef = useRef<HTMLDivElement>(null);

    const shownPokemonSlice = pokemonInfoList.slice(0, lastShownIndex);

    useEffect(() => {
        // Whenever the props change, let's reset the scrolling and the shown pokemon.
        setLastShownIndex(0);
    }, [pokemonInfoList]);

    const handleScrollCallback = useCallback(() => {
        if (lastShownIndex >= pokemonInfoList.length) {
            // Already showing all pokemon available.
            return;
        }

        if (pokemonInfoList
            .slice(lastShownIndex, Math.min(pokemonInfoList.length, lastShownIndex + batchSize))
            .some(pokemon => !globalImgData.has(pokemon.speciesId))) {
            // Next batch to show isn't ready yet.
            return;
        }

        if (window.innerHeight + window.scrollY >=
            renderDivRef.current!.offsetHeight - scrollHeightLimit
        ) {
            // Show next batch of pokemon if window scroll is less than scrollHeightLimit pixels from reaching the bottom of the page
            setLastShownIndex(previous => Math.min(previous + batchSize, pokemonInfoList.length));
        }
    }, [globalImgData, lastShownIndex, pokemonInfoList]);

    const fetchPokemonBinaryImage = async (pokemonBatch: IGamemasterPokemon[]) => {
        try {
            const promises = pokemonBatch.map(pokemon => new Promise<boolean>(async (resolve, reject) => {
                try {
                    const image = new Image();
                    image.src = pokemon.imageUrl;
                    image.onload = () => resolve(true);
                    image.onerror = () => reject(`Image failed to load: ${pokemon.imageUrl}`);
                }
                catch (error) {
                    reject(error);
                }
            }));

            const answers = await Promise.all(promises);

            setGlobalImgData(previous => {
                var newGlobalData = new Map(previous);
                answers.forEach((imageData, index) => newGlobalData.set(pokemonBatch[index].speciesId, imageData));
                return newGlobalData;
            });
        
        }
        catch (error) {
            console.error(error?.toString());
        }
    }

    useEffect(() => {
        // Not using an AbortController because it's ok to let previous axios requests finish.
        // If anything, they will always contribute to the completeness of the globalImgData map.
        const pokemonBatch: IGamemasterPokemon[] = [];
        const targetIndex = Math.min(pokemonInfoList.length, lastShownIndex + bufferSize);

        for (let i = lastShownIndex; i < targetIndex && pokemonBatch.length < batchSize; i++) {
            const pokemonId = pokemonInfoList[i].speciesId;
            if (globalImgData.has(pokemonId) || pokemonImagesAlreadyFetched.current.has(pokemonId)) {
                continue;
            }
            pokemonBatch.push(pokemonInfoList[i]);
        }
        
        if (pokemonBatch.length > 0) {
            fetchPokemonBinaryImage(pokemonBatch);
        }

    }, [lastShownIndex, pokemonInfoList, globalImgData]);

    useEffect(() => {
        // Triggering the scroll callback whenever state or props changes.
        // That's because the user might have reached the scroll threshold of the page when the next batch wasn't ready.
        // Or because props may have changed, which means the scrolling has reset, and that it needs to trigger the scrolling callback
        // in order to show the initial batch again.
        handleScrollCallback();
    }, [globalImgData, pokemonInfoList, lastShownIndex]);
    
    useEffect(() => {
        window.addEventListener("scroll", handleScrollCallback);
        return () => {
            window.removeEventListener("scroll", handleScrollCallback);
        };
    }, [handleScrollCallback]);

    return (
        <div className="grid-container">
            <div className="grid" ref={renderDivRef}>
                {shownPokemonSlice.every(pokemon => globalImgData.has(pokemon.speciesId)) ?
                    <div>
                        {shownPokemonSlice.map(p => globalImgData.has(p.speciesId) && <img key={p.speciesId} alt={p.speciesName} height={475} width={475} src={p.imageUrl}/>)}
                    </div> :
                    <div>
                        Loading...
                    </div>
                }
            </div>
        </div>
    );
});

export default PokemonGrid;
