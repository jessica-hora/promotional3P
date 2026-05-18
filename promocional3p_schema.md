# Dataset `maga-bigdata.promocional3p` — Documentação de Relacionamentos

> Gerado em 2026-05-14  
> Fonte: BigQuery `maga-bigdata.promocional3p`

---

## Diagrama de Relacionamentos

```
┌─────────────────────────────────────────────────────────────────┐
│                        promotions                               │
│  _id.oid (PK)  name  start_date  end_date  subscription_deadline│
│  channels[].benefits[].value  origin  closed                   │
└────────────────┬────────────────────────────────────────────────┘
                 │  _id.oid  ←→  promotion.id
                 │
     ┌───────────┴──────────────┐
     │                          │
     ▼                          ▼
┌──────────────────┐    ┌──────────────────────┐
│ promotion_sellers│    │   promotion_skus      │
│  _id.oid (PK)    │    │  _id.oid (PK)         │
│  promotion.id ──►│    │  id_promotion.oid ───►│→ promotions._id.oid
│  seller.id       │    │  id_promotion_seller.oid→promotion_sellers._id.oid
│  status          │◄───│  id_seller            │
│  sku_selection   │    │  sku.id               │
│  skus_count      │    │  status               │
│  entry/closed    │    │  subsidy              │
└────────┬─────────┘    └──────────────────────┘
         │
         │  id ←→ id_promotion_seller.oid
         │
         ▼
┌──────────────────────┐
│  promotion_summaries │
│  _id.oid (PK)        │
│  id_promotion.oid ──►│→ promotions._id.oid
│  id_promotion_seller.oid→ promotion_sellers._id.oid
│  id_seller           │
│  sell_value          │
│  total_channel_subsidy│
│  total_seller_subsidy │
│  items_qty           │
└──────────────────────┘


┌────────────────────────────────────────────────────────────────┐
│                          orders                                │
│  _id.oid (PK)  id_seller  detail.id_order  detail.id_order_maestro│
│  items[].id_sku  items[].promotions[].id_promotion.oid ───────►│→ promotions._id.oid
│  items[].promotions[].discount_value  refund                  │
│  status  seller_payment_status                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Tabelas

### `promotions` — Promoções criadas pelo canal/Magalu
**314.484 registros**

| Campo | Tipo | Descrição |
|---|---|---|
| `_id.oid` | STRING | **PK** — ObjectId do MongoDB |
| `name` | STRING | Nome da promoção |
| `description` | STRING | Descrição |
| `start_date` | TIMESTAMP | Início da promoção |
| `end_date` | TIMESTAMP | Fim da promoção |
| `subscription_deadline` | TIMESTAMP | Prazo para sellers aderirem |
| `origin` | STRING | Origem da promoção |
| `closed` | BOOLEAN | Promoção encerrada |
| `sellers_available_count` | INTEGER | Sellers elegíveis |
| `sellers_entered_count` | INTEGER | Sellers que aderiram |
| `channels[].id.id` | STRING | Canal (ex: marketplace) |
| `channels[].benefits[].type` | STRING | Tipo de benefício (ex: `DISCOUNT`, `SUBSIDY`) |
| `channels[].benefits[].value.percentage` | FLOAT | Percentual de desconto |
| `channels[].benefits[].subsidy.sponsor` | STRING | Quem patrocina o subsídio (MAGALU / SELLER) |
| `channels[].benefits[].subsidy.value` | FLOAT | Valor do subsídio |
| `channels[].audience.sku_selection` | STRING | Critério de seleção de SKUs |
| `channels[].automatic_entry` | BOOLEAN | Adesão automática de sellers |

---

### `promotion_sellers` — Adesão de sellers às promoções
**48.686.239 registros** | cluster: `status`

> Representa a relação N:N entre `promotions` e sellers.

| Campo | Tipo | Descrição |
|---|---|---|
| `_id.oid` | STRING | **PK** |
| `promotion.id` | STRING | **FK →** `promotions._id.oid` |
| `seller.id` | STRING | ID do seller |
| `seller.name` | STRING | Nome do seller |
| `status` | STRING | `ACTIVE`, `INACTIVE`, `PENDING`, etc. |
| `sub_status` | STRING | Sub-status |
| `entry` | BOOLEAN | Seller aderiu |
| `removed` | BOOLEAN | Seller removido |
| `closed` | BOOLEAN | |
| `automatic_entry` | BOOLEAN | Entrada automática |
| `sku_selection` | STRING | Como os SKUs foram selecionados |
| `skus_count` | INTEGER | Quantidade de SKUs do seller na promoção |
| `promotion.channel.id` | STRING | Canal da promoção |
| `promotion.benefits[].type` | STRING | Tipo de benefício herdado |
| `promotion.benefits[].value.percentage` | FLOAT | Percentual de desconto |
| `promotion.benefits[].subsidy.value` | FLOAT | Valor do subsídio |
| `origin` | STRING | |
| `status_tracking[]` | RECORD | Histórico de mudanças de status |

---

### `promotion_skus` — SKUs participantes de cada promoção/seller
**235.621.735 registros** | cluster: `id_seller`

> Detalhe por SKU de cada `promotion_sellers`.

| Campo | Tipo | Descrição |
|---|---|---|
| `_id.oid` | STRING | **PK** |
| `id_promotion.oid` | STRING | **FK →** `promotions._id.oid` |
| `id_promotion_seller.oid` | STRING | **FK →** `promotion_sellers._id.oid` |
| `id_seller` | STRING | ID do seller (desnormalizado) |
| `sku.id` | STRING | ID do SKU |
| `sku.name` | STRING | Nome do produto |
| `sku.price` | FLOAT | Preço atual |
| `sku.list_price` | FLOAT | Preço de lista |
| `status` | STRING | Status do SKU na promoção |
| `sub_status` | STRING | |
| `subsidy.type` | STRING | Tipo de subsídio aplicado |
| `subsidy.modality` | STRING | Modalidade |
| `subsidy.value` | FLOAT | Valor do subsídio para este SKU |
| `sku_sales_limit` | INTEGER | Limite de vendas do SKU |
| `qty_skus_sold` | INTEGER | Vendas realizadas |
| `origin` | STRING | |

---

### `orders` — Pedidos com promoções aplicadas
**67.698.441 registros** | cluster: `created_at`

> CDC de pedidos que contêm ao menos uma promoção. Rastreabilidade do subsídio por pedido.

| Campo | Tipo | Descrição |
|---|---|---|
| `_id.oid` | STRING | **PK** |
| `detail.id_order` | STRING | **FK →** Order ID externo (ex: `LU-123456`) |
| `detail.id_order_maestro` | STRING | ID interno Maestro |
| `id_seller` | STRING | Seller do pedido |
| `id_channel` | STRING | Canal |
| `status` | STRING | Status do pedido |
| `seller_payment_status` | STRING | Status de pagamento ao seller |
| `refund_total` | FLOAT | Total de reembolso |
| `items[].id_sku` | STRING | SKU do item |
| `items[].price` | FLOAT | Preço do item |
| `items[].qty` | INTEGER | Quantidade |
| `items[].promotions[].id_promotion.oid` | STRING | **FK →** `promotions._id.oid` |
| `items[].promotions[].discount_value` | FLOAT | Desconto aplicado no item |
| `items[].promotions[].refund` | FLOAT | Valor de subsídio a reembolsar ao seller |
| `items[].promotions[].promotion_type` | STRING | Tipo da promoção |

---

### `promotion_summaries` — Resumo financeiro por seller/promoção
**63.239.774 registros**

> Agregação financeira da promoção por seller, atualizada a cada venda.

| Campo | Tipo | Descrição |
|---|---|---|
| `_id.oid` | STRING | **PK** |
| `id_promotion.oid` | STRING | **FK →** `promotions._id.oid` |
| `id_promotion_seller.oid` | STRING | **FK →** `promotion_sellers._id.oid` |
| `id_seller` | STRING | Seller |
| `id_channel` | STRING | Canal |
| `sell_value` | FLOAT | GMV gerado pela promoção |
| `items_qty` | INTEGER | Itens vendidos |
| `average_ticket` | FLOAT | Ticket médio |
| `total_channel_subsidy` | FLOAT | Subsídio pago pelo canal (Magalu) |
| `total_seller_subsidy` | FLOAT | Subsídio pago pelo seller |

---

### `promotion_histories` — Histórico de promoções legadas
**1.138.081 registros**

> Registro histórico de promoções (parece ser formato anterior/legado).

| Campo | Tipo | Descrição |
|---|---|---|
| `id_promotion` | STRING | ID da promoção |
| `id_seller` | STRING | Seller |
| `promotion_type` | STRING | Tipo |
| `percentage_discount` | INTEGER | Percentual de desconto |
| `sku_selection` | STRING | Critério de SKUs |
| `qty_skus` | INTEGER | Quantidade de SKUs |

---

## Como a Query do `fees.py` Usa Esse Dataset

```sql
-- No BASE_QUERY da Helena, o promo3p é:
promo3p AS (
  SELECT t1.detail.id_order,           -- → Liga com order_id da helena (ex: "LU-123")
         t1.id_seller,                 -- → Liga com he_fee.seller
         SUM(promotion_element.discount_value) AS total_discount_value,
         SUM(promotion_element.refund)         AS total_refund  -- Subsídio a reembolsar
  FROM `promocional3p.orders` AS t1,
    UNNEST(t1.items.list) AS item_wrapper,
    UNNEST(item_wrapper.element.promotions.list) AS promotion_wrapper,
    UNNEST([promotion_wrapper.element]) AS promotion_element
  GROUP BY 1, 2
)
-- O join é feito com: promo3p.id_order = 'LU-' || he_fee.order_id
```

**Campos consumidos:**
- `orders.detail.id_order` → join com pedido
- `orders.id_seller` → join com seller
- `orders.items[].promotions[].discount_value` → desconto aplicado (promo cobriu)
- `orders.items[].promotions[].refund` → valor de subsídio que o canal deve reembolsar ao seller

---

## Chaves de Relacionamento (resumo)

```
promotions._id.oid
    ← promotion_sellers.promotion.id
    ← promotion_skus.id_promotion.oid
    ← promotion_summaries.id_promotion.oid
    ← orders.items[].promotions[].id_promotion.oid

promotion_sellers._id.oid
    ← promotion_skus.id_promotion_seller.oid
    ← promotion_summaries.id_promotion_seller.oid

orders.detail.id_order  ←→  'LU-' + helena.fees_calculatedpayload.order_id
orders.id_seller        ←→  helena.fees_calculatedpayload.seller
```
