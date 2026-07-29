# SET Análise Região Leste

Análise do mercado de trabalho formal (SET/IDT), com mapa, KPIs, rankings e
gráficos alimentados pela planilha publicada no Google Sheets.

## Como executar

1. Ajuste o caminho do Python em `run_server.bat` se necessário
2. Execute `run_server.bat`
3. Abra: http://127.0.0.1:8001/mapa?aba=analise_leste

A porta **8001** evita conflito com o Observatório (8000).

## Estrutura

```
set_analise_leste/
├── run_server.bat
├── README.md
├── backend/
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── mapa.html
    ├── css/
    ├── js/
    │   ├── mapa-app.js
    │   ├── analise-leste.js
    │   └── map-ce-regioes.js
    ├── geo/
    └── assets/
```

## Dados

Planilha
[SET_Análise Região Leste](https://docs.google.com/spreadsheets/d/e/2PACX-1vRYap5Q-G4J4RT1VKQ2vismTIPeEgVTnax0U-GXlKntfK0HXBSRko9zakIzo218MLFhSCtchFrY0Z_I/pub?gid=0)
(`frontend/js/analise-leste.js` → `CAGED_GRUP_CSV_URL`)
