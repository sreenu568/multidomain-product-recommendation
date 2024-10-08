//"Cross-domain Recommendation and 3d network graph"

import React, { useState, useEffect } from "react";
import axios from "axios";
import Papa from "papaparse";
import Ratingplot from "./Ratingplot";
import { useRecommendations } from "./RecommendationsContext"; //

// Placeholder image URL

const placeholderImage = "https://via.placeholder.com/150";

const domainNameMapping = {
  Movies_and_TV: "Movies and TV",
  Books: "Books",
  All_Beauty: "Beauty",
  Amazon_Fashion: "Fashion",
  Cell_Phones_and_Accessories: "Phones",
};

const RecommendationDashboard5 = ({
  tweets,
  selectedBooks,
  selectedMovies,
  beauty,
  fashion,
  phones,
  username,
  onRecommendedProducts,
  recommendedProducts = {}, // Initialize as an empty object
}) => {
  const {
    recommendations,
    setRecommendations,
    selectedDomain,
    setSelectedDomain,
    loading,
    setLoading,
    showExplanation,
    setShowExplanation,
    showProductName,
    setShowProductName,
  } = useRecommendations(); // Use the context

  const [error, setError] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [truncatedNames, setTruncatedNames] = useState({});

  useEffect(() => {
    loadCsvData("/finalmetabooks.csv"); // Replace with your CSV file path
  }, []);

  const loadCsvData = (filePath) => {
    Papa.parse(filePath, {
      download: true,
      header: true,
      complete: (results) => {
        //console.log("CSV Data:", results.data); // Debugging: Log CSV Data
        setCsvData(results.data);
      },
      error: (error) => {
        console.error("Error loading CSV data:", error);
      },
    });
  };

  const parseJsonString = (jsonString) => {

    const cleanedString = jsonString
    .replace(/```json\s*/g, '') // Remove ```json marker
    .replace(/```/g, '') // Remove ending ```
    .replace(/^[^{]*{/, '{') // Remove any text before the first opening brace
    .replace(/}[^}]*$/, '}') // Remove any text after the last closing brace
    .trim(); // Trim any leading or trailing whitespace
    console.log("cleaned string",cleanedString)
    try {
     // console.log("json string",jsonString)
      return JSON.parse(cleanedString);
    } catch (error) {
      console.log("json string",cleanedString)
      console.error("Error parsing JSON string:", error);
      return {};
    }
  };

  useEffect(() => {
    onRecommendedProducts(recommendations);
  }, [recommendations, onRecommendedProducts]);

  const fetchRecommendationsForDomain = async (domain) => {
    const selection = {
      Movies_and_TV: selectedMovies,
      Books: selectedBooks,
      All_Beauty: beauty,
      Amazon_Fashion: fashion,
      Cell_Phones_and_Accessories: phones,
    };

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/getRecomByDomainCrossdomain",
        {
          selection: {
            //[domain]: selection[domain] || [], // Include only the selected domain with its data
            Movies_and_TV: selectedMovies || [],
            Books: selectedBooks || [],
            All_Beauty: beauty || [],
            Amazon_Fashion: fashion || [],
            Cell_Phones_and_Accessories: phones || [],
          },
          domain: domain,
          personality: "Based on the provided Twitter posts, the user appears",
        }
      );
      const reque={
        selection: {
          //[domain]: selection[domain] || [], // Include only the selected domain with its data
          Movies_and_TV: selectedMovies || [],
          Books: selectedBooks || [],
          All_Beauty: beauty || [],
          Amazon_Fashion: fashion || [],
          Cell_Phones_and_Accessories: phones || [],
        },
        domain: domain,
        personality: "Based on the provided Twitter posts, the user appears",
      }
      console.log("request object",reque)
      console.log(`Recommended data for ${domain}:`, response.data);
      return { domain, data: response.data };
    } catch (err) {
      console.error(`Error fetching recommendations for ${domain}:`, err);
      setError(`Error fetching recommendations for ${domain}`);
      return { domain, data: null };
    }
  };

  const handleRecommendation = async () => {
    if (
      tweets.length === 0 &&
      selectedBooks.length === 0 &&
      selectedMovies.length === 0
    ) {
      setError(
        "Please select at least one book, movie, or tweet for recommendations."
      );
      return;
    }

    if (!selectedDomain) {
      setError("Please select a domain.");
      return;
    }

    setLoading((prev) => ({ ...prev, [selectedDomain]: true }));
    setError(null);

    const domainsToFetch = Object.keys(domainNameMapping);
    const results = await Promise.all(
      domainsToFetch.map((domain) => fetchRecommendationsForDomain(domain))
    );

    const newRecommendations = results.reduce((acc, result) => {
      const { domain, data } = result;
      if (data) {
        const crossDomainData = data["cross-domain"][domain] || {};
        acc[domain] = {
          top_5: parseJsonString(crossDomainData.top_5 || "{}"),
          top_best: parseJsonString(crossDomainData.top_best || "{}"),
        };
      } else {
        acc[domain] = {};
      }
      return acc;
    }, {});

    setRecommendations((prevRecommendations) => ({
      ...prevRecommendations,
      ...newRecommendations,
    }));

    setLoading((prev) => ({ ...prev, [selectedDomain]: false }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleRecommendation();
  };

  const handleDomainChange = (event) => {
    setSelectedDomain(event.target.value);
  };

  const handleExplanationToggle = (productName) => {
    setShowExplanation((prevState) => ({
      ...prevState,
      [productName]: !prevState[productName],
    }));
  };

  const handleProductDoubleClick = (productName) => {
    setShowProductName((prevState) => ({
      ...prevState,
      [productName]: !prevState[productName],
    }));
  };

  const toggleTruncatedName = (productName) => {
    setTruncatedNames((prevState) => ({
      ...prevState,
      [productName]: !prevState[productName],
    }));
  };

  return (
    <div className="mt-8">
      <label
        htmlFor="domain-select"
        className="block text-lg font-semibold mb-2"
      >
        Pick a Category to Personalize
      </label>
      <select
        id="domain-select"
        value={selectedDomain}
        onChange={handleDomainChange}
        className="border p-2 rounded"
      >
        <option value="">-- Select a Domain --</option>
        {Object.keys(domainNameMapping).map((domain) => (
          <option key={domain} value={domain}>
            {domainNameMapping[domain]}
          </option>
        ))}
      </select>

      <div className="container mx-auto pt-4">
        <form onSubmit={handleSubmit} className="mb-4">
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Explore Personalize Recommendations
          </button>
        </form>
        {Object.keys(loading).some((key) => loading[key]) && <p>Loading...</p>}
        {error && <p>{error}</p>}
      </div>

      {selectedDomain && recommendedProducts[selectedDomain] && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">
            Recommendations for {domainNameMapping[selectedDomain]}
          </h2>
          {recommendedProducts[selectedDomain]?.top_5 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">
                Top 5 Recommendations
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.values(recommendedProducts[selectedDomain].top_5).map(
                  (rec, index) => (
                    <div
                      key={index}
                      className="border p-4 rounded flex flex-col items-center"
                      onDoubleClick={() =>
                        handleProductDoubleClick(rec["product name"])
                      }
                    >
                      <img
                        src={rec["image link"] || placeholderImage}
                        alt={rec["product name"]}
                        className="w-full h-48 object-cover mb-2"
                      />
                   <div className="flex flex-col items-center justify-between h-20">
                      {rec["product name"].length > 30 ? (
                        <p className="font-semibold text-justify text-blue-700">
                          {truncatedNames[rec["product name"]] ? (
                            <>
                              {rec["product name"]}
                              <button
                                className="text-slate-500 ml-2"
                                onClick={() =>
                                  toggleTruncatedName(rec["product name"])
                                }
                              >
                                Show Less
                              </button>
                            </>
                          ) : (
                            <>
                              {rec["product name"].slice(0, 30)}...
                              <button
                                className="text-slate-500  ml-1 mb-4"
                                onClick={() =>
                                  toggleTruncatedName(rec["product name"])
                                }
                              >
                                Show More
                              </button>
                            </>
                          )}
                        </p>
                      ) : (
                        <p className="font-semibold text-justify text-blue-700">
                          {rec["product name"]}
                        </p>
                      )}
                    </div>
                      <button
                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mt-4"
                        onClick={() =>
                          handleExplanationToggle(rec["product name"])
                        }
                      >
                        {showExplanation[rec["product name"]]
                          ? "Hide Explanation"
                          : "Show Explanation"}
                      </button>
                      {showExplanation[rec["product name"]] && (
                        <p className="mt-2 text-gray-700 text-justify">
                          {rec["reason"]}
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
          {recommendedProducts[selectedDomain]?.top_best && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">
                Top Best Recommendation
              </h3>
              <div className="border p-4 rounded flex items-center">
                <img
                  src={
                    recommendedProducts[selectedDomain].top_best["product 1"][
                      "image link"
                    ] || placeholderImage
                  }
                  alt={
                    recommendedProducts[selectedDomain].top_best["product 1"][
                      "product name"
                    ]
                  }
                  className="w-80 h-70 object-cover mr-4"
                />
                <div className="flex-1">
                  <p className="font-semibold text-justify text-blue-700">
                    {
                      recommendedProducts[selectedDomain].top_best["product 1"][
                        "product name"
                      ]
                    }
                  </p>
                  <button
                    className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mt-4"
                    onClick={handleExplanationToggle}
                  >
                    {showExplanation ? "Hide Explanation" : "Show Explanation"}
                  </button>
                  {showExplanation && (
                    <p className="mt-2 text-gray-700 text-justify">
                      {
                        recommendedProducts[selectedDomain].top_best[
                          "product 1"
                        ]["reason"]
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {recommendedProducts[selectedDomain]?.top_best && (
        <Ratingplot
          bookTitle={"Watercolor with Me in the Jungle"}
          domain={selectedDomain}
        />
      )}
    </div>
  );
};

export default RecommendationDashboard5;
