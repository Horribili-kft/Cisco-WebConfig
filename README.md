Disclaimers
--------------
> [!WARNING]  
> **This is a school project. We do not guarantee security, but it should be safe to use within a LAN**

A projekt fejlesztésének elkezdése
--------------


  
1. Klónozd a repo-t (Windowson erősen ajánlott a [GitHub desktop](https://desktop.github.com/))

```bash
git clone https://github.com/Horribili-kft/Cisco-WebConfig
```

> [!TIP]
> Ha Windowson vagy, futtasd a setup.ps1 scriptet, ez telepít mindent ami szükséges, de lesz amit lehet neked kell manuálisan (a script utasítására) megcsinálnod. Ugorj az 5. lépéshez.

> [!TIP]
> Ha debian alapú linuxon vagy, futtasd a setup.sh scriptet, ez telepít mindent ami szükséges. Ugorj az 5. lépéshez
2. Telepítsd a [node.js-t](https://nodejs.org/)


3. Telepítsd a szükséges node csomagokat:

```bash
cd Cisco-WebConfig
npm install --include=dev --legacy-peer-deps
```
4. Telepítsd a szükséges python csomagokat (telepíts pythont ha még nincs):
```
pip install paramiko
```
5. Végül futtasd a development servert:
```bash
npm  run  dev
```
[http://localhost:3000](http://localhost:3000) 

Az oldal automatikusan frissít ahogy változtatod a kódot. 

A saját branchedbe dolgozz, **NE A MAINBE**

