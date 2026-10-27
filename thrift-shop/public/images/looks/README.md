# Whole-outfit photos

Drop the photo of each complete outfit **being worn** in this folder, using the
look id as the filename:

| Look id                | Filename                            |
| ---------------------- | ----------------------------------- |
| `after-dark-black`     | `after-dark-black.jpg`              |
| `burgundy-camel`       | `burgundy-camel.jpg`                |
| `holographic-set`      | `holographic-set.jpg`               |
| `mustard-garden`       | `mustard-garden.jpg`                |
| `red-hot`              | `red-hot.jpg`                       |

Landscape or portrait both work — the card crops to a 4:5 frame with
`object-cover`. Portrait (roughly 4:5) looks best.

Then confirm the path in `thrift-shop/data/looks.ts`:

```ts
wornImage: '/images/looks/after-dark-black.jpg',
```

Until a file is present the site composes a flat-lay collage from the
individual piece photos instead, so no look ever renders as an empty box.
