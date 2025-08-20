import puppeteer from "puppeteer";
import fs from "fs";

// Load up a JSON file containing the event pricing data, this will be saved back to the same file later
const eventsJson = JSON.parse(fs.readFileSync("./public/events.json", "utf8"));

let eventsDataRequest = await fetch(
  "https://app.ticketmaster.com/discovery/v2/events.json?dmaId=303&venueId=KovZpZA6keIA,KovZpZAdEJEA,KovZpZAEAAJA,ZFr9jZeeAF,KovZpvEk7A&size=200&sort=date,asc&apikey=8AitfWbBFcBGMknVk8AsRqpSIHpF4tJn"
);

if (!eventsDataRequest.ok) {
  console.error("Failed to fetch events data:", eventsDataRequest.statusText);
  process.exit(1);
}
const eventsData = await eventsDataRequest.json();
if (
  !eventsData ||
  !eventsData["_embedded"] ||
  !eventsData["_embedded"]["events"]
) {
  console.error("Invalid events data structure:", eventsData);
  process.exit(1);
}

// Load in the data from events.json
let events = eventsData["_embedded"]["events"];

let activeEvents = events
  .filter((x) => x?.dates?.status?.code === "onsale")
  .filter((x) => new Date(x?.sales?.public?.endDateTime) > new Date())
  .filter(
    (x) =>
      !JSON.stringify(x.classifications).includes("Sightseeing/Facility") &&
      !JSON.stringify(x.classifications).includes("Upsell")
  );

if (activeEvents.length > 0) {
  const browser = await puppeteer.launch({
    headless: false, // Set to true if you want to run in headless mode
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1388, height: 1097 });
  while (true) {
    for (const evt of activeEvents) {
      try {
        // Navigate the page to a URL.
        await page.goto(evt.url, {
          waitUntil: "networkidle2",
        });

        await page.waitForSelector("#ismqp-template-left");

        await sleep(1500);

        const filterButton = await page.$("#edp-quantity-filter-button");
        if (filterButton) {
          await filterButton.click();
          await sleep(1000);
        } else {
          console.log("Filter button not found for " + evt.name);
          continue; // Skip to the next event if the filter button is not found
        }

        const priceRange = [];
        const priceSliders = await page.$$(".rc-slider__label-input"); // returns an array of handles
        if (priceSliders.length === 4) {
          let firstValue = await page.evaluate(
            (el) => el.value,
            priceSliders[2]
          );
          let endValue = await page.evaluate((el) => el.value, priceSliders[3]);
          if (firstValue && endValue) {
            priceRange.push(firstValue);
            priceRange.push(endValue);
          }
        } else if (priceSliders.length === 2) {
          let firstValue = await page.evaluate(
            (el) => el.value,
            priceSliders[0]
          );
          let endValue = await page.evaluate((el) => el.value, priceSliders[1]);
          if (firstValue && endValue) {
            priceRange.push(firstValue);
            priceRange.push(endValue);
          }
        } else {
          console.log("Less than 2 elements found for " + evt.name);
        }

        console.log(
          "Price range for " + evt.name + ": " + priceRange.join(" - ")
        );

        if (priceRange.length === 0) {
          console.log("No price range found for " + evt.name);
          continue; // Skip to the next event if no price range is found
        }

        // Save the price range to the pricingData object with the date so we can track changes
        if (!eventsJson[evt.id]) {
          eventsJson[evt.id] = {
            id: evt.id,
            priceRange: [],
            name: evt.name,
            url: evt.url,
            dates: evt.dates,
            latestLowestPrice: parseFloat(priceRange[0].replace(/\D/g, "")),
            lastUpdated: new Date().toString(),
            logoUrl: evt?.images?.filter((x) => x.width === 205)[0]?.url || "",
            venueId: evt["_embedded"]?.venues?.[0]?.id || null,
            venueName: evt["_embedded"]?.venues?.[0]?.name || null,
            venueCity: evt["_embedded"]?.venues?.[0]?.city?.name || null,
            venueState: evt["_embedded"]?.venues?.[0]?.state?.name || null,
          };
        }

        if (
          eventsJson[evt.id].logoUrl === undefined ||
          eventsJson[evt.id].logoUrl === null
        ) {
          eventsJson[evt.id].logoUrl =
            evt?.images?.filter((x) => x.width === 205)[0]?.url || "";
        }

        if (
          eventsJson[evt.id].id === undefined ||
          eventsJson[evt.id].id === null
        ) {
          eventsJson[evt.id].id = evt.id;
        }

        if (
          eventsJson[evt.id].priceRange === undefined ||
          eventsJson[evt.id].priceRange === null
        ) {
          eventsJson[evt.id].priceRange = [];
        }

        if (
          (eventsJson[evt.id].venueId === undefined ||
            eventsJson[evt.id].venueId === null) &&
          evt["_embedded"] &&
          evt["_embedded"]["venues"] &&
          evt["_embedded"]["venues"].length > 0
        ) {
          eventsJson[evt.id].venueId = evt["_embedded"]["venues"][0].id;
        }

        if (
          (eventsJson[evt.id].venueName === undefined ||
            eventsJson[evt.id].venueName === null) &&
          evt["_embedded"] &&
          evt["_embedded"]["venues"] &&
          evt["_embedded"]["venues"].length > 0
        ) {
          eventsJson[evt.id].venueName = evt["_embedded"]["venues"][0].name;
        }

        if (
          (eventsJson[evt.id].venueCity === undefined ||
            eventsJson[evt.id].venueCity === null) &&
          evt["_embedded"] &&
          evt["_embedded"]["venues"] &&
          evt["_embedded"]["venues"].length > 0 &&
          evt["_embedded"]["venues"][0].city &&
          evt["_embedded"]["venues"][0].city.name
        ) {
          eventsJson[evt.id].venueCity =
            evt["_embedded"]["venues"][0].city.name;
        }

        if (
          (eventsJson[evt.id].venueState === undefined ||
            eventsJson[evt.id].venueState === null) &&
          evt["_embedded"] &&
          evt["_embedded"]["venues"] &&
          evt["_embedded"]["venues"].length > 0 &&
          evt["_embedded"]["venues"][0].state &&
          evt["_embedded"]["venues"][0].state.name
        ) {
          eventsJson[evt.id].venueState =
            evt["_embedded"]["venues"][0].state.name;
        }

        eventsJson[evt.id].latestLowestPrice = parseFloat(
          priceRange[0].replace(/\D/g, "")
        );
        eventsJson[evt.id].lastUpdated = new Date().toString();

        // if the file `./public/events/${evt.id}.json` doesn't exist, create it
        if (!fs.existsSync(`./public/events/${evt.id}.json`)) {
          fs.writeFileSync(
            `./public/events/${evt.id}.json`,
            JSON.stringify(eventsJson[evt.id], null, 2)
          );
        }

        // Read the existing JSON file for the event and update the price range array with the latest price range
        const eventSpecificJson = JSON.parse(
          fs.readFileSync(`./public/events/${evt.id}.json`, "utf8")
        );

        eventSpecificJson.priceRange.push({
          date: new Date().toString(),
          lowestPrice: parseFloat(priceRange[0].replace(/\D/g, "")),
          upperPrice: parseFloat(priceRange[1].replace(/\D/g, "")),
        });

        // Write the updated JSON back to the file
        fs.writeFileSync(
          `./public/events/${evt.id}.json`,
          JSON.stringify(eventSpecificJson, null, 2)
        );

        // Save the updated pricing data back to the JSON file
        fs.writeFileSync(
          "./public/events.json",
          JSON.stringify(eventsJson, null, 2)
        );
      } catch (error) {
        console.log("Error processing event " + evt.name + ": " + error);
        continue; // Skip to the next event on error
      }
    }
  }
  // await browser.close();
}

// promise method to sleep
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
