import { IGamemasterPokemon } from "../DTOs/IGamemasterPokemon";
import "./PokemonImage.css";

interface IPokemonImage {
    pokemon: IGamemasterPokemon
}

const PokemonImage = ({pokemon}: IPokemonImage) => {
    return (
        <div className="images_container">
            <img className="image" alt={pokemon.speciesName} height={475} width={475} src={pokemon.imageUrl}/>
            {pokemon.isShadow && <img className='image shadow-overlay' src="https://i.imgur.com/4FYNAqX.png" alt={pokemon.speciesName} height={475} width={475} />}
        </div>
    );
}

export default PokemonImage;