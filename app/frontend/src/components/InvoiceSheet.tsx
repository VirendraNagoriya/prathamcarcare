import { View, Text, StyleSheet } from 'react-native'
import { colors, font } from '../theme'
import type { InvoiceDetail } from '../api/client'
import { formatINR, formatDate } from '../utils/format'
import { amountInWords } from '../utils/amountInWords'
import { CogLogo } from './CogLogo'

const BLANK_ROWS = 2

export default function InvoiceSheet({
  invoice,
  googleReviewUrl,
}: {
  invoice: InvoiceDetail
  googleReviewUrl?: string
}) {
  const total = parseFloat(invoice.total_amount) || 0
  const words = invoice.amount_in_words || amountInWords(total)

  return (
    <View nativeID="invoice-print" style={styles.card}>
      <View style={styles.headerSection}>
        <View style={styles.logoBox}>
          <CogLogo size={110} />
        </View>
        <View style={styles.companyInfo}>
          <Text style={styles.mainTitle}>PRATHAM CAR CARE</Text>
          <Text style={styles.mainSubtitle}>Multibrand Car Service</Text>
          <Text style={styles.addressText}>
            Address: near Vedant Mangalam, Karvenagar, Pune{'\n'}
            <Text style={styles.addressBold}>Call: 9011560540 / 9665939486</Text>
          </Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>M/s.</Text>
          <Text style={styles.metaValue} numberOfLines={1}>{invoice.owner_name}</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Mob.:</Text>
          <Text style={styles.metaValue}>{invoice.owner_phone}</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Car No.</Text>
          <Text style={styles.metaValue}>{invoice.plate_number}</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Bill NO.:</Text>
          <Text style={[styles.metaValue, styles.metaValueBold]}>{invoice.bill_ref}</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Km.:</Text>
          <Text style={styles.metaValue}>{invoice.km_reading || '—'}</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Date:</Text>
          <Text style={styles.metaValue}>{formatDate(invoice.created_at)}</Text>
        </View>
        <View style={[styles.metaCell, styles.metaCellWide]}>
          <Text style={styles.metaLabel}>Next Servicing Km.</Text>
          <Text style={styles.metaValue}>{invoice.next_service_km || '—'}</Text>
        </View>
        {invoice.next_service_date ? (
          <View style={[styles.metaCell, styles.metaCellWide]}>
            <Text style={styles.metaLabel}>Next Service Date</Text>
            <Text style={styles.metaValue}>{invoice.next_service_date}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.table}>
        <View style={[styles.tr, styles.thead]}>
          <Text style={[styles.th, styles.thCell, styles.colSr]}>Sr.</Text>
          <Text style={[styles.th, styles.thCell, styles.colName]}>Particulars</Text>
          <Text style={[styles.th, styles.thCell, styles.colQty]}>Qty</Text>
          <Text style={[styles.th, styles.thCell, styles.colRate, styles.cRight]}>Rate (₹)</Text>
          <Text style={[styles.th, styles.thCell, styles.colAmt, styles.cRight]}>Amount (₹)</Text>
        </View>

        {invoice.items.map((it, i) => (
          <View key={it.id ?? i} style={styles.tr}>
            <Text style={[styles.td, styles.colSr, styles.cCenter]}>{i + 1}</Text>
            <Text style={[styles.td, styles.colName, styles.tdName]}>{it.product_name}</Text>
            <Text style={[styles.td, styles.colQty, styles.cCenter]}>{it.quantity}</Text>
            <Text style={[styles.td, styles.colRate, styles.cRight]}>{formatINR(it.unit_rate)}</Text>
            <Text style={[styles.td, styles.colAmt, styles.cRight, styles.tdName]}>{formatINR(it.charged_amount)}</Text>
          </View>
        ))}

        {Array.from({ length: BLANK_ROWS }).map((_, i) => (
          <View key={`blank-${i}`} style={styles.tr}>
            <Text style={[styles.td, styles.colSr]}> </Text>
            <Text style={[styles.td, styles.colName]} />
            <Text style={[styles.td, styles.colQty]} />
            <Text style={[styles.td, styles.colRate]} />
            <Text style={[styles.td, styles.colAmt]} />
          </View>
        ))}

        <View style={[styles.tr, styles.totalStrip]}>
          <Text style={[styles.td, styles.totalLabelCell]}>Total</Text>
          <Text style={[styles.td, styles.totalValCell]}>{formatINR(total)}</Text>
        </View>
      </View>

      <View style={styles.wordsSection}>
        <Text style={styles.wordsText}>
          <Text style={styles.wordsStrong}>Rs. in words: </Text>
          {words}
        </Text>
      </View>

      <View style={styles.signRow}>
        <View style={styles.sigBlock}>
          <View style={styles.sigLine}>
            <Text style={styles.sigText}>Customer's Signature</Text>
          </View>
        </View>
        <Text style={styles.thankYou}>Thank You…!</Text>
        <View style={styles.sigBlock}>
          <Text style={styles.forText}>For Pratham car care</Text>
          <View style={styles.sigLine}>
            <Text style={styles.sigText}>Proprietor</Text>
          </View>
        </View>
      </View>

      {googleReviewUrl ? (
        <View style={styles.reviewFooter}>
          <Text style={styles.reviewText}>
            Loved our service?
            {' '}
            <Text style={styles.reviewLink} onPress={() => window.open(googleReviewUrl, '_blank')}>
              Rate us on Google
            </Text>
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    maxWidth: 700,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 2,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: 2,
    borderBottomColor: colors.navy,
    paddingBottom: 16,
    marginBottom: 16,
  },
  logoBox: {
    width: 110,
    height: 110,
    marginRight: 18,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInfo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mainTitle: { color: colors.navy, fontSize: font.title, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' },
  mainSubtitle: { fontSize: font.lg, fontWeight: '600', color: colors.slate, marginVertical: 2, textAlign: 'center' },
  addressText: { fontSize: font.xs, color: colors.muted, lineHeight: 16, textAlign: 'center' },
  addressBold: { fontWeight: '800' },

  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: 6,
    marginBottom: 16,
    backgroundColor: colors.metaBg,
    overflow: 'hidden',
  },
  metaCell: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.rowLine,
  },
  metaCellWide: { width: '100%' },
  metaLabel: { fontWeight: '800', color: colors.navy, width: 118, flexShrink: 0, fontSize: font.md },
  metaValue: { color: '#0f172a', fontWeight: '600', fontSize: font.md, flexShrink: 1 },
  metaValueBold: { fontWeight: '800' },

  table: { marginTop: 12 },
  tr: { flexDirection: 'row' },
  thead: { backgroundColor: colors.navy },
  th: { color: '#ffffff', textTransform: 'uppercase', fontSize: font.sm, fontWeight: '700' },
  thCell: { paddingVertical: 8, paddingHorizontal: 6, borderWidth: 1, borderColor: colors.navy, justifyContent: 'center' },
  td: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.blue,
    fontSize: font.md,
    color: '#334155',
  },
  tdName: { fontWeight: '600' },
  colSr: { width: '8%', textAlign: 'center' },
  colName: { width: '44%' },
  colQty: { width: '10%', textAlign: 'center' },
  colRate: { width: '18%' },
  colAmt: { width: '20%' },
  cCenter: { textAlign: 'center' },
  cRight: { textAlign: 'right' },
  totalStrip: { backgroundColor: '#f0fdf4' },
  totalLabelCell: {
    width: '72%',
    borderTopWidth: 2,
    borderTopColor: colors.navy,
    fontWeight: '800',
    color: colors.navy,
    fontSize: font.lg,
    textAlign: 'right',
    textTransform: 'uppercase',
    paddingRight: 12,
  },
  totalValCell: {
    width: '28%',
    borderTopWidth: 2,
    borderTopColor: colors.navy,
    fontWeight: '800',
    color: colors.navy,
    fontSize: font.lg,
    textAlign: 'right',
    paddingRight: 10,
  },

  wordsSection: {
    fontSize: font.sm,
    marginTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    borderStyle: 'dashed',
    color: colors.slate,
  },
  wordsText: { color: colors.slate, fontSize: font.sm },
  wordsStrong: { fontWeight: '800', color: colors.slate },

  signRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sigBlock: { textAlign: 'center', width: 160 },
  sigLine: { borderTopWidth: 1, borderTopColor: '#94a3b8', marginTop: 40, paddingTop: 4, alignItems: 'center' },
  sigText: { color: colors.muted, fontSize: font.sm },
  thankYou: { fontStyle: 'italic', fontWeight: '800', color: colors.navy, fontSize: font.md, paddingBottom: 2 },
  forText: { fontSize: 10, fontWeight: '800', color: colors.navy, textAlign: 'center' },
  reviewFooter: { marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.rowLine },
  reviewText: { fontSize: font.sm, color: colors.muted, textAlign: 'center' },
  reviewLink: { fontWeight: '800', color: colors.blue },
})