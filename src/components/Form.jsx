// "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=0&longitude=0"
import Button from "./Button";
import DatePicker from "react-datepicker";
import { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";

import styles from "./Form.module.css";
import { useNavigate } from "react-router-dom";

import BackButton from "./BackButton";

import { useUrlPosition } from "../hooks/useUrlPosition";
import Message from "./Message";
import Spinner from "./Spinner";
import { useCities } from "../contexts/CitiesContext";

export function convertToEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

const BASE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

function Form() {
  const navigate = useNavigate();
  const [cityName, setCityName] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [lat, lng] = useUrlPosition();
  const [isLoadingGeoCoding, setisLoadingGeoCoding] = useState(false);
  const [emoji, setEmoji] = useState("");
  const [geoCodingErro, setCodeError] = useState("");
  const { createCity, isLoading } = useCities();
  useEffect(
    function () {
      if (!lat || !lng) return;
      async function fetchCityData() {
        try {
          setisLoadingGeoCoding(true);
          setCodeError("");
          const res = await fetch(
            `${BASE_URL}?latitude=${lat}&longitude=${lng}`
          );
          const data = await res.json();
          if (!data.countryCode) {
            throw new Error(
              "That does not appear to be a city please click other option"
            );
          }
          setCityName(data.city || data.locality || "");
          setCountry(data.countryName);
          setEmoji(convertToEmoji(data.countryCode));
        } catch (err) {
          setCodeError(err.message);
        } finally {
          setisLoadingGeoCoding(false);
        }
      }
      fetchCityData();
    },
    [lat, lng]
  );

  if (isLoadingGeoCoding) return <Spinner />;

  if (!lat || !lng) return <Message message="Start by clicking on the map" />;

  if (geoCodingErro) return <Message message={geoCodingErro} />;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!cityName || !date) return;

    const newCity = {
      cityName,
      country,
      emoji,
      date,
      notes,
      position: { lat, lng },
    };

    await createCity(newCity);
    navigate("/app/cities");
  }

  return (
    <form
      className={`${styles.form} ${isLoading ? StyleSheet.loading : ""}`}
      onSubmit={handleSubmit}
    >
      <div className={styles.row}>
        <label htmlFor="cityName">City name</label>
        <input
          id="cityName"
          onChange={(e) => setCityName(e.target.value)}
          value={cityName}
        />
        <span className={styles.flag}>{emoji}</span>
      </div>

      <div className={styles.row}>
        <label htmlFor="date">When did you go to {cityName}?</label>
        <DatePicker
          id="date"
          onChange={(date) => setDate(date)}
          selected={date}
          dateFormat={"dd/MM/yyyy"}
        />
      </div>

      <div className={styles.row}>
        <label htmlFor="notes">Notes about your trip to {cityName}</label>
        <textarea
          id="notes"
          onChange={(e) => setNotes(e.target.value)}
          value={notes}
        />
      </div>

      <div className={styles.buttons}>
        <Button type="primary">Add</Button>
        <BackButton />
      </div>
    </form>
  );
}

export default Form;
