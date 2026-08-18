# AGENTS — LE BOA TOTEM DE SOYA

## Mode de travail

- Continuer la production sans demander de validation intermédiaire pour Drive, GitHub ou Render.
- Ne pas utiliser l’utilisateur comme relais entre systèmes.
- La validation humaine intervient une seule fois, à la vraie fin de la production, lorsque le gate visuel est réellement PASS.
- Ne jamais déclarer un livrable final parce qu’un fichier existe, qu’un compteur est correct ou qu’une CI est verte.
- Ouvrir et contrôler le rendu réel de chaque asset final.

## État actuel

- Production : `IN_PRODUCTION`.
- Recette humaine : `SUSPENDED`.
- Publication : `FORBIDDEN`.
- Étape active : model sheets définitifs SOYA / CILLO / SIDAAT, puis personnages secondaires NÉNÉ ADAMA / VENDEUR.
- Drive production : `1wHHgFc9IYdc4OhNk0eeq1O3t42IL2FkM`.
- Branche model sheets : `agent/boa-model-sheets-production-20260818`.

## Sources visuelles

Priorité A : Drive `1-Sds8HUOvPxHnivPTsarik_xxBXhXd9Kwpv0E9UY-xQ` + référentiel audit `1qcd_MMlvVMCvKJknUGjH-MQGiFyc_PXBKDZV-JMxeMc`.

Priorité B : V0.3 mobile, dossier Drive `12LWyeU632usX7dJ9EBun_PyaAxQQOWjb`, uniquement pour matière/lumière/décor/gestuelle. Ne pas reprendre son boa visible ni ses textes comme canon.

Sources rejetées pour personnages : `18TnkUST3T58xZi91TSXGdD0-SVKek4mf`, `1KsCtlHmEluN_qEbCG6rP8LRogrLOZXzl`.

## Verrous absolus

- SOYA : 9–11 ans, héroïne centrale, tresses peules longues, aucun voile.
- CILLO : 6–9 ans, côtés très courts, une bande centrale front–nuque arrêtée exactement à la nuque, aucune tresse/natte/queue/retombée arrière, aucune barbe.
- SIDAAT : 4–6 ans, plus petite et plus ronde, tresses peules courtes, aucun voile.
- NÉNÉ ADAMA : nom actif dans les scripts ; MAAM JALLEL est un label historique, ne jamais créer deux personnages.
- Boa : aucune présence physique complète ; uniquement signes abstraits. Aucun contact enfant/boa.
- Aucun signe religieux visible.
- Direction : aquarelle numérique réaliste, jeunesse premium, lumière naturelle.

## Dialogues verrouillés

- CILLO : « Attends... ça recommence seulement quand tu avances. »
- SIDAAT : « Soya, tes jambes ont peur ? »
- CILLO : « On doit demander qui les a faites. »
- SIDAAT : « Le boa aussi a eu mal ? »
- SOYA : « C'est moi que le signe a arrêtée. Alors c'est moi qui dois commencer. »

La décision SOYA est en P16 C4, une seule bulle. P18 n’ajoute aucun dialogue.

## Gate final

Ne créer/promouvoir `visual-qa-final.json` qu’après contrôle visuel réel de tous les assets. `scripts/validate-boa-visual-final.mjs` doit passer avant réouverture de la recette humaine. Les model sheets ont en plus leur gate sur la branche dédiée.
