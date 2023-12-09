import { PropsWithChildren } from "react";
import { IGamemasterPokemon } from "../DTOs/IGamemasterPokemon";
import { PokemonTypes } from "../DTOs/PokemonTypes";
import { useLanguage } from "../contexts/language-context";
import translator, { TranslatorKeys } from "../utils/Translator";
import PokemonImage from "./PokemonImage";
import "./PokemonInfoImagePlaceholder.scss";
import gameTranslator, { GameTranslatorKeys } from "../utils/GameTranslator";

interface IPokemonInfoImagePlaceholderProps {
    pokemon: IGamemasterPokemon;
    computedCP: number;
    computedAtk: number;
    computedDef: number;
    computedHP: number;
    displayLevel: number;
    setDisplayLevel: (newLevel: number) => void;
    imageRef?: React.RefObject<HTMLImageElement>
}

const valueToLevel = (value: number) => {
    return value / 2 + 0.5
}

const PokemonInfoImagePlaceholder = (props: PropsWithChildren<IPokemonInfoImagePlaceholderProps>) => {
    const {currentLanguage, currentGameLanguage} = useLanguage();

    const translatedType = (type: PokemonTypes) => {
        const translatorKey = TranslatorKeys[type];
        return translator(translatorKey as any, currentLanguage)
    }

    return <div className="pokemon_main_info item">
                <PokemonImage
                    ref={props.imageRef}
                    pokemon={props.pokemon}
                    withName={false}
                    withMetadata
                />
                <div>
                    <span className="pokemon_number">
                        #
                        {props.pokemon.dex}
                    </span>
                    <span className="pokemon_types">
                        {props.pokemon.types[0] && <span className="pokemon_type_bg" style={{backgroundColor: `var(--type-${props.pokemon.types[0]})`}}>
                            {translatedType(props.pokemon.types[0])}
                        </span>}
                        {props.pokemon.types[1] && <span className="pokemon_type_bg" style={{backgroundColor: `var(--type-${props.pokemon.types[1]})`}}>
                            {translatedType(props.pokemon.types[1])}
                        </span>}
                    </span>
                <span className="cp-level big">
                    <strong className="cp-container very-big">{props.computedCP} {gameTranslator(GameTranslatorKeys.CP, currentGameLanguage).toLocaleUpperCase()}</strong> @
                    <div className="weighted-font">{translator(TranslatorKeys.LVL, currentLanguage)}&nbsp;{<select value={props.displayLevel} onChange={e => props.setDisplayLevel(+e.target.value)} className="select-level big">
                        {Array.from({length: 101}, (_x, i) => valueToLevel(i + 1))
                        .map(e => (<option key={e} value={e}>{e}</option>))}
                    </select>}</div>
                </span>
            </div>
        </div>;
}

export default PokemonInfoImagePlaceholder;