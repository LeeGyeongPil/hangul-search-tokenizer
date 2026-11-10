# Small corpus benchmark (hand-written Korean documents)

Documents: 80, queries: 78. All configurations run on MiniSearch 7.
P@5 = relevant share of the returned top-5 hits (0 when nothing is returned).

| config | Recall@5 | Recall@10 | MRR@10 | P@5 | index bytes | terms | index ms |
|---|---|---|---|---|---|---|---|
| minisearch-default | 0.317 | 0.317 | 0.423 | 0.423 | 15245 | 441 | 3 |
| vitepress-default | 0.877 | 0.879 | 0.910 | 0.878 | 15240 | 441 | 1.8 |
| char-bigram | 0.908 | 0.929 | 0.934 | 0.760 | 23303 | 741 | 2.8 |
| hst | 0.946 | 0.950 | 0.981 | 0.951 | 12414 | 368 | 4 |
| hst+bigram | 0.989 | 0.994 | 0.994 | 0.922 | 16910 | 526 | 2.2 |
| garu | 0.952 | 0.956 | 0.962 | 0.949 | 11252 | 329 | 95.2 |

Recall@10 by query type:

| config | noun | noun+josa | verb | mixed | compound | trap |
|---|---|---|---|---|---|---|
| minisearch-default | 0.310 | 0.651 | 0.000 | 0.800 | 0.050 | 0.042 |
| vitepress-default | 1.000 | 0.880 | 0.657 | 1.000 | 0.667 | 1.000 |
| char-bigram | 1.000 | 1.000 | 0.806 | 0.800 | 1.000 | 1.000 |
| hst | 0.972 | 1.000 | 0.931 | 1.000 | 0.467 | 1.000 |
| hst+bigram | 1.000 | 1.000 | 0.972 | 1.000 | 1.000 | 1.000 |
| garu | 0.944 | 1.000 | 1.000 | 1.000 | 0.900 | 0.833 |
