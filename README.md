# Laboratorio — Revisión de código seguro SIN IA (Módulo 5023)

> Material del Máster FP en Ciberseguridad · módulo 5023 *Puesta en producción segura*.
> Este repositorio contiene las dos aplicaciones víctima usadas en la **sesión guiada** de revisión de
> código y la guía paso a paso para montarlo tú mismo en tu equipo y repetirlo con calma.
>
> ⚠️ **AVISO IMPORTANTE:** la code base contiene vulnerabilidades **DELIBERADAS** con fines exclusivamente
> didácticos. Ejecuta todo en `localhost`, **nunca** lo despliegues en un servidor accesible ni lo subas
> a un repositorio público como "plantilla". No es software real: es un laboratorio.

---

## 1. ¿Qué contiene este repositorio?

```
lab-revision-codigo-segura/
├── README.md            ← este documento (montaje + referencia de herramientas)
├── mis-reglas.yaml      ← reglas Semgrep escritas en clase (fuente → sumidero)
├── node-vuln/           ← App Node.js "ciber-shop" (tienda de demo, 9 fallos)
│   ├── package.json     ← dependencias de 2020 con vulnerabilidades publicadas (SCA)
│   ├── server.js        ← Express con fallos en el código (SAST/DAST)
│   └── docs/nota.txt
└── php-vuln/            ← App PHP "panel acceso" (4 fallos) — va en XAMPP
    ├── db.php . login.php . saludo.php . descarga.php
    ├── setup.sql        ← base de datos de laboratorio (MariaDB de XAMPP)
    └── docs/nota.txt
```

Las dos apps ilustran exactamente los conceptos de la clase: **fuente (source)** = dato que entra del
usuario; **sumidero (sink)** = lugar donde ese dato puede causar daño; vulnerabilidad = fuente llega al
sumidero sin validación.

---

## 2. Qué hace cada software (y para qué sirve en este laboratorio)

Las herramientas de seguridad del laboratorio se corresponden con las **formas clásicas de revisar
código** (pág. 3 del PDF de la sesión): SCA, SAST y DAST. Ninguna sustituye a las demás — el mensaje
central es que trabajan **por capas**.

### 2.1 npm audit — SCA (Software Composition Analysis)

| | |
|---|---|
| **Qué hace** | Compara las librerías declaradas en `package.json`/`package-lock.json` con la base de avisos de npm (GitHub Advisory Database: CVE/GHSA) y lista las dependencias con vulnerabilidad publicada, su severidad y si existe versión arreglada. |
| **Fortalezas** | Cero instalación (viene con npm), instantáneo, perfecto como primer paso y como check de CI. Enseña a leer advisories GHSA y el dilema "el fix existe pero es breaking change". |
| **Carencias** | **Solo mira dependencias, nunca tu código** (el SQLi de `login.php` le da igual). No analiza si la librería vulnerable se usa realmente en el flujo (falta de "reachability"). Su informe es el más pobre del laboratorio. |

### 2.2 Snyk CLI — SCA enterprise + SAST

| | |
|---|---|
| **Qué hace** | Lo mismo que npm audit pero con informe mucho más rico (`snyk test`), y además analiza EL PROPIO CÓDIGO con taint multi-fichero (`snyk code test`): sigue el dato desde la petición HTTP hasta el sumidero aunque cruce funciones y ficheros. Es el estándar de facto en empresas (integración con GitHub/GitLab, PRs, dashboards). |
| **Fortalezas** | Dos análisis (dependencias + código) con una sola herramienta; informe con severidad, CVE, ruta del flujo y parche sugerido; exit code apto para pipelines; el motor de código (DeepCode) es de los mejores en flujo fuente→sumidero. |
| **Carencias** | Necesita **cuenta y conexión** (el código se analiza en su nube → política de confidencialidad antes de usarlo con código de empresa). Motor cerrado, no puedes escribir tus propias reglas. Plan gratuito: dependencias ilimitadas (1 usuario) pero ~100 análisis de código (Snyk Code)/mes. |

### 2.3 Semgrep — SAST open source

| | |
|---|---|
| **Qué hace** | Análisis estático con **reglas declarativas**: una regla YAML define fuente, sumidero y (opcionalmente) sanitizadores, y el motor encuentra TODAS las ocurrencias en el código. Los packs públicos (`p/javascript`, `p/php`, `p/secrets`…) traen miles de reglas de la comunidad. |
| **Fortalezas** | La más didáctica: en 6 líneas escribes tu propia regla y entiendes **cómo piensa un SAST**. Rapidísimo, funciona local (el código no sale de tu máquina), reglas propias mantenibles por el equipo, corriendo en CI es el complemento determinista perfecto (pág. 9 del PDF). |
| **Carencias** | Su cobertura depende de las reglas disponibles: los packs pillan mucho pero no todo (y las reglas comunitarias varían en calidad → falsos positivos). Sin dashboard/servidor central en la versión OSS. En Windows se instala por `pip` (versiones recientes lo soportan; si tu versión falla, hay imagen Docker oficial como plan B). |

### 2.4 SonarQube Community Build — SAST enterprise + calidad de código

| | |
|---|---|
| **Qué hace** | Servidor auto-alojado (en Docker) que analiza el proyecto y lo muestra en un **dashboard web**: Issues, Security Hotspots, Code Smells, cobertura y **Quality Gate** (la "nota" que un CI puede bloquear). Es lo que verás en casi cualquier empresa con proceso de desarrollo serio. |
| **Fortalezas** | El portal y la noción de **hotspot** ("aquí puede haber problema, un humano decide") son oro para aprender triage; 21 lenguajes; gate integrable en pipelines; historia de proyectos y comparativas entre análisis. |
| **Carencias** | La instalación es la más pesada del laboratorio (Java/JVM vía Docker, ~2 GB de RAM, arranque lento). El análisis de flujo de datos profundo (taint avanzado) y varias funciones de seguridad (informes OWASP/CWE, detección de secretos completa) quedan en **ediciones de pago** — la Community te enseña el "cómo se gestiona", no el máximo poder. |

### 2.5 OWASP ZAP — DAST (Dynamic Application Security Testing)

| | |
|---|---|
| **Qué hace** | Ataca la aplicación **en marcha** desde fuera, como un atacante: rastrea (spider), hace escaneo pasivo de cada respuesta y escaneo activo con payloads reales (XSS, traversal, redirecciones…). También es un proxy de interceptación para pruebas manuales avanzadas. |
| **Fortalezas** | El único que valida la app desplegada real (encuentra lo que el código estático no puede: cabeceras ausentes, X-Powered-By, cookies sin banderas, XSS que solo se ve al servir la respuesta). Gratuito, con GUI muy visual para clase y modo CLI para CI. |
| **Carencias** | **Solo ve lo que es accesible desde fuera** (pág. 3 del PDF): no descubre secretos en el código, ni fallos de lógica interna blindados, ni dependencias. Depende del crawl: endpoints no enlazados no se prueban salvo que los alcances manualmente. Falsos positivos en lógica de negocio. |

### 2.6 Software de entorno (infraestructura del laboratorio)

| Software | Qué es aquí |
|---|---|
| **Node.js + npm** | Runtime y gestor de paquetes de la app `node-vuln`. Necesitas la LTS (20/22). Limitación natural: versiones antiguas de paquetes no compilan a veces en Node muy nuevo — en este lab todo corre en Node 22 sin problema. |
| **XAMPP** | Apache + PHP + MariaDB + phpMyAdmin en un clic para la app `php-vuln`. Ojo a su naturaleza: es entorno de desarrollo — root sin contraseña es lo normal aquí y **jamás** en un servidor real. |
| **Python** | Lo necesita Semgrep para instalarse por `pip`. Cualquier 3.10+ sirve. |
| **Docker Desktop** | Ejecuta SonarQube y (plan B) Semgrep sin instalarlos "de verdad" en tu Windows. Requiere WSL2; el icono de la ballena debe estar verde antes de usar SonarQube. |
| **Git** | Para clonar este repositorio y, en clase, para ver los **diffs** al arreglar cada fallo (el commit de la corrección es parte de la evidencia). |

---

## 3. Instalación paso a paso

> Tiempo total estimado: **45–60 min** la primera vez. Haz las verificaciones ✓ de cada paso antes de seguir.

### Paso 0 — (Opcional) Git

Descarga: <https://git-scm.com/download/win> (siguiente-siguiente).

```powershell
git --version          # ✓ ver nº versión
git clone <URL_DE_ESTE_REPO>       # o descarga el ZIP si no tienes cuenta
cd lab-revision-codigo-segura
```

### Paso 1 — Node.js (app node-vuln)

1. Descarga la **LTS** de <https://nodejs.org> e instala (por defecto).
2. Verifica y arranca la app:

```powershell
node -v                # ✓ v20 o v22
npm -v                 # ✓ 10.x
cd node-vuln
npm install            # instala las 5 dependencias "vintage" (69 paquetes)
npm start              # ✓ abre http://localhost:3000 → verás el menú de enlaces
```

Deja esta consola abierta (el servidor vive ahí). Para pararla: `Ctrl+C`.

### Paso 2 — XAMPP (app php-vuln)

1. Descarga de <https://www.apachefriends.org> e instala en `C:\xampp` (por defecto).
2. Abre el **XAMPP Control Panel** y pulsa *Start* en **Apache** y **MySQL**.
3. Copia la app al directorio web e import la base de datos:

```powershell
Copy-Item -Recurse "<ruta\de\este\repo>\php-vuln" "C:\xampp\htdocs\ciber"
C:\xampp\mysql\bin\mysql.exe -u root < "C:\xampp\htdocs\ciber\setup.sql"
# ✓ alternativa sin consola: phpMyAdmin (http://localhost/phpmyadmin) → Importar → setup.sql
```

4. Verifica en el navegador:
   - `http://localhost/ciber/saludo.php?nombre=Alumno` ✓ te saluda
   - `http://localhost/ciber/login.php` ✓ (usuario de prueba: `ana@demo.es` / `123456`)

La base de datos creada es `ciber` (tabla `usuarios` con 1 usuario). Si MySQL no arranca por conflicto
de puertos, mira el log en el propio panel (suele ser el 3306 ocupado por otra MariaDB).

### Paso 3 — Python + Semgrep (SAST)

1. Python si no lo tienes: <https://www.python.org/downloads/> (marca "Add to PATH").
2. Instala y verifica:

```powershell
python3 -m pip install semgrep     # o: pipx install semgrep (recomendado si pip se queja)
semgrep --version                  # ✓ nº versión
```

3. Primer escaneo con packs públicos:

```powershell
# desde la raíz del repo:
semgrep scan --config p/javascript --config p/secrets node-vuln --metrics=off
semgrep scan --config p/php                   php-vuln  --metrics=off
```

Si pide login: `semgrep login` una vez (gratis, con GitHub/Google).

4. Y con **las reglas que escribimos en clase** (`mis-reglas.yaml`):

```powershell
semgrep scan --config mis-reglas.yaml node-vuln php-vuln --metrics=off
```

✓ Deben salir hallazgos marcados como `nodo-path-traversal`, `php-sqli-concatenado`, etc.

> **Plan B Windows:** si la instalación nativa falla, usa el contenedor:
> `docker run --rm -v "${PWD}:/src" semgrep/semgrep semgrep scan --config p/javascript /src`

### Paso 4 — Snyk (SCA enterprise + SAST)

1. Crea cuenta gratuita en <https://app.snyk.io/signup> (login con GitHub o Google).
2. Instala el CLI y autentícate (abre el navegador una vez):

```powershell
npm install -g snyk
snyk auth             # ✓ se abre el navegador; vuelve a la consola al confirmar
snyk whoami           # ✓ tu email
```

3. Escanea las dos caras de Snyk:

```powershell
cd node-vuln
snyk test             # SCA: dependencias con CVE
snyk code test        # SAST: TU código (path traversal, XSS, secretos…)
cd ..\php-vuln
snyk code test        # SAST sobre PHP
```

✓ En `node-vuln` verás Path Traversal y credenciales en duro entre los hallazgos de código.
Guarda los resmenes: los usarás al comparar herramientas.

### Paso 5 — Docker Desktop + SonarQube (SAST enterprise)

1. Docker Desktop: <https://www.docker.com/products/docker-desktop/> (activa WSL2 si te lo pide y
   reinicia). ✓ Verifica con `docker --version` y que la ballena está en verde.

2. Arranca SonarQube Community Build (la primera vez descarga ~1 GB y tarda 1–2 min en levantarse):

```powershell
docker run -d --name sonarqube -p 9000:9000 sonarsource/sonarqube:latest
docker logs -f sonarqube        # espera a " SonarQube is operational " y Ctrl+C
```

3. Entra en <http://localhost:9000> — usuario `admin`, contraseña `admin` → te pedirá cambiarla.
   **Guárdala.**
4. Genera tu token: en el menú de arriba a la derecha → **My Account → Security → Generate Token**.
   Cópialo (no se vuelve a mostrar).
5. Analiza las dos apps (sustituye `TU_TOKEN`; la ruta `-v` apunta a la CARPETA de la app):

```powershell
docker run --rm -e SONAR_HOST_URL="http://host.docker.internal:9000" -e SONAR_TOKEN="TU_TOKEN" -v "C:\ruta\de\este\repo\node-vuln:/usr/src" sonarsource/sonar-scanner-cli -Dsonar.projectKey=ciber-node -Dsonar.sources=. "-Dsonar.exclusions=node_modules/**,package-lock.json"

docker run --rm -e SONAR_HOST_URL="http://host.docker.internal:9000" -e SONAR_TOKEN="TU_TOKEN" -v "C:\ruta\de\este\repo\php-vuln:/usr/src" sonarsource/sonar-scanner-cli -Dsonar.projectKey=ciber-php -Dsonar.sources=.
```

✓ En el portal: *Projects* → `ciber-node` → recorre **Overview / Issues / Security Hotspots** y mira el
**Quality Gate**. En hotspots busca la credencial en duro y el uso de MD5.
Para apagar/encender el servidor más adelante: `docker stop sonarqube` / `docker start sonarqube`.

### Paso 6 — OWASP ZAP (DAST)

1. Descarga el instalador Windows de <https://www.zaproxy.org/download/> (o el "cross-platform" si
   prefieres Java aparte).
2. Abre ZAP → pestaña **Quick Start** → **Automated Scan**:
   - URL: `http://localhost:3000` (app Node) → *Launch Scan*.
   - Activa el **Active Scan** cuando termine el spider y deja que ataque (2–3 min).
3. Recorre las **Alerts**: XSS reflejada en `/saludo`, cabeceras ausentes (CSP, X-Content-Type-Options),
   X-Powered-By… Repite contra `http://localhost/ciber/saludo.php`.
4. (Para clase) el proxy manual: *Quick Start → Manual Explore* lanza el navegador de ZAP e intercepta.

---

## 4. Chuleta de comandos (todo instalado)

| Herramienta | App Node (`node-vuln`, puerto 3000) | App PHP (`php-vuln` en htdocs) |
|---|---|---|
| **SCA** | `npm audit` (en la carpeta) | — (sin gestor de paquetes) |
| **Snyk SCA** | `snyk test` | — |
| **Snyk SAST** | `snyk code test` | `snyk code test` |
| **Semgrep packs** | `semgrep scan --config p/javascript --config p/secrets node-vuln --metrics=off` | `semgrep scan --config p/php ... php-vuln` |
| **Semgrep propias** | `semgrep scan --config mis-reglas.yaml node-vuln php-vuln --metrics=off` | (incluido) |
| **SonarQube** | scanner `-v ...\node-vuln:/usr/src` → proyecto `ciber-node` | scanner `-v ...\php-vuln:/usr/src` → `ciber-php` |
| **ZAP** | Automated Scan `http://localhost:3000` | `http://localhost/ciber/…` |
| **Arrancar app** | `cd node-vuln && npm start` | XAMPP: Apache + MySQL en Start |

---

## 5. Mapa de vulnerabilidades de las apps (referencia de la clase)

### node-vuln (`server.js`)

| # | Fallo | Dónde | Fix de referencia |
|---|---|---|---|
| 1 | Secretos/credenciales en duro (`JWT_SECRET`, `API_KEY`, `DB_PASSWORD`) | cabecera del fichero | variables de entorno + rotación |
| 2 | MD5 para "hashear" contraseñas | `hashMal()` | bcrypt/argon2 |
| 3 | XSS reflejado | `GET /saludo` | escapar HTML (helper `esc()`) |
| 4 | Path traversal | `GET /fichero?ruta=` | `path.resolve` + comprobar prefijo |
| 5 | `eval()` con input | `GET /calc?expr=` | no usar eval; parser seguro o lista blanca |
| 6 | Inyección de comandos | `GET /ping?host=` → `exec()` | `execFile` con array de args / lista blanca |
| 7 | Contraseñas en claro + JWT firmado con secreto del repo | `GET /login` | hash + secreto externo |
| 8 | Token verificable por cualquiera que conozca el repo | `GET /perfil` | `jwt.verify` + algoritmo fijado |
| 9 | 12 vulnerabilidades SCA (axios, lodash, jsonwebtoken, moment + cadena express) | `package.json` | `npm audit fix --force` (¡major versions!) + pruebas |

Explotación rápida de referencia:
`/fichero?ruta=../server.js` · `/calc?expr=require('child_process').execSync('whoami').toString()`
· `/ping?host=localhost%20%26%20whoami` · `/saludo?name=<script>alert(1)</script>` (URL-encode).

### php-vuln

| # | Fallo | Dónde | Fix de referencia |
|---|---|---|---|
| 1 | SQLi por concatenación | `login.php` | PDO con consultas preparadas |
| 2 | XSS reflejado | `saludo.php` | `htmlspecialchars()` |
| 3 | Path traversal | `descarga.php` (`readfile`) | resolver + comprobar prefijo `docs/` |
| 4 | Credenciales en claro (root sin password) | `db.php` | usuario propio con contraseña fuerte |

Explotación rápida de referencia: login con email `ana@demo.es' -- ` (o `' OR '1'='1' -- `);
`saludo.php?nombre=<script>alert(1)</script>`; `descarga.php?archivo=../saludo.php`.

---

## 6. Problemas frecuentes

| Problema | Solución |
|---|---|
| `EADDRINUSE :3000` (o `:3010`) | Otra app ocupa el puerto: ciérrala o cambia `PORT` en `server.js`. |
| MySQL no arranca en XAMPP | Revisa el log del panel; suele ser el 3306 ocupado (skype/MariaDB local). |
| `semgrep: command not found` | Reinicia la terminal tras instalar; o usa `python3 -m semgrep scan …`. |
| Semgrep falla en Windows | Plan B Docker (sección Paso 3). |
| SonarQube no arranca / no carga | Espera 1–2 min y mira `docker logs sonarqube`; necesita ~2 GB libres. |
| El scanner no conecta con SonarQube | Dentro del contenedor, `localhost` es el propio contenedor: usa `host.docker.internal` (así está en el comando). |
| `snyk auth` no abre navegador | Copia la URL que imprime el CLI al navegador con tu sesión. |
| ZAP no encuentra nada | Comprueba que la app responde y lanza Active Scan explícito (el spider solo, no ataca). |

---

## 7. Normas de uso responsable

- Todo en `localhost`. Sin escaneos a sistemas que no sean estos laboratorios.
- Las credenciales de las apps (`ana@demo.es/123456`, etc.) son de laboratorio: no las uses fuera.
- Si el código va a una herramienta en la nube (Snyk, auditorías externas), recuerda la regla de
  confidencialidad: esto es material público de clase, pero aplica el mismo criterio con repos de empresa.
- El fix correcto de cada fallo está en la columna "Fix de referencia" y se practicó en la sesión:
  la parte divertida es conseguir que, tras tu parche, **todas** las herramientas queden en verde.

Material relacionado (misma carpeta de clase): `practicas-revision-codigo-sin-ia.md` (guion completo
con tiempos y hoja de respuestas) y `practica_alumnos/` (práctica CTF de descubrimiento con la app GestiFAc).
