Monmignon clothes — v4 (panier + Stripe)

1) Déploiement recommandé (Vercel) :
   - Crée un compte sur vercel.com
   - Crée un nouveau projet à partir de ce dossier (uploade le zip ou pousse sur Git)
   - Dans Project Settings > Environment Variables, ajoute STRIPE_SECRET_KEY avec ta clé secrète (sk_live... ou sk_test...)
   - Clique sur "Redeploy".
   - Ouvre l’URL du site déployé : le paiement Stripe est actif (bouton "Payer avec Stripe").

2) Mode test Stripe :
   - Dans ton Dashboard Stripe, utilise les cartes de test (ex : 4242 4242 4242 4242, date future, CVC 123).
   - Les sessions de paiement sont visibles dans Stripe > Payments.

3) Local (optionnel) :
   - Il faut un petit serveur (ex. Vercel CLI)
   - Installe Node, puis : npm i && npm i -g vercel && vercel dev
   - Ouvre http://localhost:3000

4) Personnalisation :
   - Prix : modifie 6500 (centimes) dans api/create-checkout-session.js et script.js (fonction subtotal)
   - Produits : modifie les <article class="card"> dans index.html (data-id, data-name, data-img)
   - Styles : styles.css

Note : Sans hébergement, l’appel Stripe ne peut pas fonctionner depuis un simple fichier ouvert en local (sécurité/CORS).