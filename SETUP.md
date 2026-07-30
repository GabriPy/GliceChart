# Setup

## Prerequisiti

- Node.js 20+
- MySQL 8.0+
- (opzionale) Docker + Docker Compose

---

## Metodo 1: Docker Compose (consigliato)

> Il container si connette al **tuo MySQL già esistente** sulla macchina host (non crea un MySQL separato).

---

### 🌿 Istruzioni specifiche per Debian / Linux

#### A. Installa Docker e Docker Compose Plugin (se non l'hai fatto)
```bash
# Rimuovi vecchie versioni
sudo apt-get remove docker docker-engine docker.io containerd runc

# Dipendenze
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Aggiungi repo ufficiale Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installa
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# (Opzionale) Aggiungi il tuo utente al gruppo docker per evitare sudo ogni volta
sudo usermod -aG docker $USER
# Logout e login nuovamente, oppure:
newgrp docker
```

Verifica:
```bash
docker --version
docker compose version
```

#### B. Configura MySQL per accettare connessioni da Docker
Il file di config di MySQL su Debian è tipicamente **`/etc/mysql/mysql.conf.d/mysqld.cnf`** (oppure `/etc/mysql/my.cnf`):
```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Cambia o aggiungi:
```ini
bind-address = 0.0.0.0
mysqlx-bind-address = 0.0.0.0
```

Salva e riavvia MySQL:
```bash
sudo systemctl restart mysql
```

#### C. Permessi sull'utente MySQL
Apri la shell MySQL:
```bash
sudo mysql -u root -p
```

Poi esegui (sostituisci con le TUE credenziali reali):
```sql
-- Estendi i permessi all'utente che usi per GliceChart (es. 'glucoview')
GRANT ALL PRIVILEGES ON glucoview.* TO 'glucoview'@'%' IDENTIFIED BY 'tua_password_vera';
FLUSH PRIVILEGES;
EXIT;
```

#### D. Firewall (se ufw è attivo)
```bash
# Permetti connessioni MySQL dalla rete Docker (bridge 172.17.0.0/16)
sudo ufw allow from 172.17.0.0/16 to any port 3306
# Oppure apri a tutto il mondo (solo se sei dietro router/firewall sicuro):
# sudo ufw allow 3306/tcp
sudo ufw reload
```

#### E. DB_HOST su Linux/Debian
Nel `.docker.env`, su Docker Engine Linux **non esiste `host.docker.internal` di default**. Tuttavia il `docker-compose.yml` di questo progetto ha già `extra_hosts: host.docker.internal:host-gateway` che lo crea automaticamente.

👉 Quindi puoi usare **entrambe** queste opzioni (scegline una):
```bash
# Opzione 1 (consigliata): usa l'alias già configurato nel compose
DB_HOST=host.docker.internal

# Opzione 2: usa direttamente l'IP del bridge Docker (solitamente 172.17.0.1)
DB_HOST=172.17.0.1
```
Se non funziona, trova l'IP corretto con:
```bash
ip -4 addr show docker0 | grep -Po 'inet \K[\d.]+'
```

---

### 🪟 Istruzioni specifiche per Windows / Mac

#### Configura MySQL
Il tuo MySQL locale deve accettare connessioni non solo da `localhost` ma anche dall'indirizzo del bridge Docker. Modifica il bind nel file `my.ini`:
```ini
bind-address = 0.0.0.0
```
Poi riavvia MySQL.

#### Permessi utente DB
Assicurati che l'utente DB abbia i permessi da host diversi:
```sql
GRANT ALL PRIVILEGES ON glucoview.* TO 'glucoview'@'%' IDENTIFIED BY 'tua_password';
FLUSH PRIVILEGES;
```

#### DB_HOST
```bash
DB_HOST=host.docker.internal   # Già impostato di default in .docker.env.example
```

---

### 🚀 Avvio (tutti i sistemi)
```bash
cd /percorso/della/cartella/glicechart

cp .docker.env.example .docker.env
# Modifica .docker.env con:
#   DB_HOST (come sopra)
#   DB_NAME, DB_USER, DB_PASSWORD = credenziali REALI del tuo MySQL esistente
#   GLUROO_API_SECRET_TOKEN e GLUROO_API_SECRET_HEADER = obbligatori

docker compose up -d --build
```

App disponibile su http://localhost:3001 (o http://IP-DEL-TUO-SERVER:3001 su server remoto)

**Log**: `docker compose logs -f app`
**Stop**: `docker compose down`
**Riavvia dopo modifiche**: `docker compose up -d --build`

---

## Metodo 2: Sviluppo Locale

### 1. Configura MySQL

Crea database e utente (o usa le credenziali di default):

```sql
CREATE DATABASE glucoview;
CREATE USER 'glucoview'@'localhost' IDENTIFIED BY 'glucoview';
GRANT ALL PRIVILEGES ON glucoview.* TO 'glucoview'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Variabili d'ambiente

Crea `backend/.backend.env`:

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=glucoview
DB_PASSWORD=glucoview
DB_NAME=glucoview

# Server
PORT=3001
POLL_INTERVAL_MINUTES=5
PUBLIC_API_URL=

# Gluroo / Nightscout
GLUROO_BASE_URL=https://aaa1.ns.gluroo.com
GLUROO_API_SECRET_TOKEN=il_tuo_token
GLUROO_API_SECRET_HEADER=la_tua_api_secret
```

### 3. Installa dipendenze

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 4. Build frontend (solo produzione)

```bash
cd frontend
npm run build
```

### 5. Avvia servizi

**Backend** (in un terminale):
```bash
cd backend
npm run dev
```

**Frontend dev server** (in un altro terminale - richiama API via proxy):
```bash
cd frontend
npm run dev
```

Frontend dev: http://localhost:5173
Backend API: http://localhost:3001/api

---

## Variabili d'ambiente

| Nome | Default | Obbligatoria | Descrizione |
|------|---------|--------------|-------------|
| `DB_HOST` | localhost | No | Host MySQL |
| `DB_PORT` | 3306 | No | Porta MySQL |
| `DB_USER` | glucoview | No | Utente DB |
| `DB_PASSWORD` | (vuoto) | No | Password DB |
| `DB_NAME` | glucoview | No | Nome database |
| `PORT` | 3001 | No | Porta server |
| `POLL_INTERVAL_MINUTES` | 5 | No | Frequenza sync Gluroo |
| `PUBLIC_API_URL` | (vuoto) | No | URL pubblico per log |
| `GLUROO_BASE_URL` | https://aaa1.ns.gluroo.com | No | API endpoint |
| `GLUROO_API_SECRET_TOKEN` | — | **Sì** | Token Bearer Gluroo |
| `GLUROO_API_SECRET_HEADER` | — | **Sì** | Header api-secret |

---

## Database

Tabelle create automaticamente al primo avvio:

- `readings` — letture glicemiche da Gluroo
- `insulin_records` — iniezioni di insulina
- `carb_records` — assunzione carboidrati
- `notes` — note/eventi testuali
- `diet_foods` — database alimenti per dietometro
- `settings` — impostazioni utente (riga singola id=1)
