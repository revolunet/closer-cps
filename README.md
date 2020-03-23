# closest-postcode

Generate mappings from postcode to closest postcode having more than N habitants. N=1000 in `output-1000.json`.

⚠️ If the city already has more than N habitants, it is not included in the dataset.

## Usage

```sh
yarn
yarn index
```

It takes ~20mins to generate all the datasets

## Datasets

Data is extracted from these files :

- geolocations : https://www.data.gouv.fr/fr/datasets/data-insee-sur-les-communes/
- populations : https://www.insee.fr/fr/statistiques/3545833?sommaire=3292701
