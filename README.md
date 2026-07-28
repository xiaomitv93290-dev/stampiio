# Stampiio — site de démonstration

## Lancer le site
Ouvrez `index.html` dans un navigateur, ou servez le dossier avec :

```bash
python3 -m http.server 8080
```

Puis ouvrez `http://localhost:8080`.

## Fonctionnalités présentes
- Site commercial responsive
- Connexion de démonstration
- Tableau de bord commerçant
- Gestion locale des clients et récompenses
- Personnalisation de carte Wallet
- Scanner simulé et ajout/retrait de points
- Export CSV des transactions
- Données persistées dans `localStorage`

## Pour la production
La génération réelle des passes Apple Wallet nécessite un compte Apple Developer, un Pass Type ID et un certificat de signature. Google Wallet nécessite un compte Issuer approuvé et ses identifiants API. Le paiement réel exige également une intégration Stripe côté serveur.
