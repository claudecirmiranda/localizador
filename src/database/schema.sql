CREATE TABLE IF NOT EXISTS estabelecimentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo INTEGER NOT NULL UNIQUE,
    apelido TEXT NOT NULL,

    logradouro TEXT NOT NULL,
    numero TEXT,
    bairro TEXT,
    cidade TEXT NOT NULL,
    uf TEXT NOT NULL,
    cep TEXT,

    endereco_completo TEXT,

    latitude REAL,
    longitude REAL,
    google_place_id TEXT,

    logo_url TEXT,

    ativo INTEGER NOT NULL DEFAULT 1,

    geocodificado_em TEXT,
    atualizado_em TEXT,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_estabelecimentos_ativo
ON estabelecimentos(ativo);

CREATE INDEX IF NOT EXISTS idx_estabelecimentos_geoloc
ON estabelecimentos(latitude, longitude);
