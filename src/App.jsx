import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchContainerRef = useRef(null);

  useEffect(() => {
    fetchPokemonList();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPokemonList = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://pokeapi.co/api/v2/pokemon?limit=151");
      
      const detailedList = await Promise.all(
        res.data.results.map(async (item) => {
          const detailRes = await axios.get(item.url);
          return detailRes.data;
        })
      );

      setPokemonList(detailedList);
    } catch (err) {
      setError("Failed to load Pokémon list.");
    } finally {
      setLoading(false);
    }
  };

  const startsWithQuery = (p, query) => {
    if (!query) return true;
    const cleanQuery = query.toLowerCase().replace(/^#/, "");
    const formattedId = String(p.id).padStart(3, "0");

    return (
      p.name.toLowerCase().startsWith(cleanQuery) ||
      String(p.id).startsWith(cleanQuery) ||
      formattedId.startsWith(cleanQuery)
    );
  };

  const matchesQuery = (p, query) => {
    if (!query) return true;
    const cleanQuery = query.toLowerCase().replace(/^#/, "");
    const formattedId = String(p.id).padStart(3, "0");

    return (
      p.name.toLowerCase().includes(cleanQuery) ||
      String(p.id) === cleanQuery ||
      formattedId.includes(cleanQuery)
    );
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    const query = value.trim().toLowerCase();
    if (query.length > 0) {
      const matches = pokemonList
        .filter((p) => startsWithQuery(p, query))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 6);
      
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (pokemon) => {
    setSearchInput(pokemon.name);
    setActiveQuery(pokemon.name);
    setShowSuggestions(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveQuery(searchInput.trim());
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setSearchInput("");
    setActiveQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const filteredList = pokemonList.filter((p) => matchesQuery(p, activeQuery));

  return (
    <div className="pokedex-container">
      <div className="ribbon-title-container">
        <div className="ribbon-wrapper">
          <div className="ribbon-tail left-tail"></div>
          <div className="ribbon-main">
            <h1>Pokédex</h1>
          </div>
          <div className="ribbon-tail right-tail"></div>
        </div>
      </div>

      <form
        className="search-form"
        onSubmit={handleSearchSubmit}
        ref={searchContainerRef}
      >
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchInput}
            onChange={handleInputChange}
            onFocus={() => searchInput.trim() && setShowSuggestions(true)}
            onKeyDown={(e) => e.key === "Escape" && setShowSuggestions(false)}
          />
          {searchInput && (
            <button
              type="button"
              className="clear-btn"
              onClick={handleClear}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <ul className="suggestions-dropdown">
              {suggestions.map((pokemon) => (
                <li
                  key={pokemon.id}
                  onClick={() => handleSelectSuggestion(pokemon)}
                  className="suggestion-item"
                >
                  <img
                    src={
                      pokemon.sprites.front_default ||
                      pokemon.sprites.other["official-artwork"].front_default
                    }
                    alt={pokemon.name}
                    className="suggestion-thumb"
                  />
                  <span className="suggestion-name">{pokemon.name}</span>
                  <span className="suggestion-id">
                    #{String(pokemon.id).padStart(3, "0")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button type="submit" className="search-btn">
          Search
        </button>
      </form>

      {loading && <p className="status-msg">Loading Pokémon...</p>}
      {error && <p className="error-msg">{error}</p>}

      {!loading && (
        <div className="pokemon-horizontal-container">
          {filteredList.map((poke) => (
            <div key={poke.id} className="pokemon-card-wrapper">
              <img
                className="peeking-sprite"
                src={
                  poke.sprites.other["official-artwork"].front_default ||
                  poke.sprites.front_default
                }
                alt={poke.name}
              />

              <div className="pokemon-horizontal-card">
                <span className="poke-id">
                  #{String(poke.id).padStart(3, "0")}
                </span>

                <h3>{poke.name}</h3>

                <div className="types">
                  {poke.types.map((t) => (
                    <span
                      key={t.type.name}
                      className={`type-badge ${t.type.name}`}
                    >
                      {t.type.name}
                    </span>
                  ))}
                </div>

                <div className="poke-details">
                  <p>
                    <strong>Height:</strong> {poke.height / 10} m
                  </p>
                  <p>
                    <strong>Weight:</strong> {poke.weight / 10} kg
                  </p>
                </div>
              </div>
            </div>
          ))}
          {filteredList.length === 0 && !loading && (
            <p className="status-msg">No Pokémon found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;