import { Modal, View, Text, Pressable, StyleSheet } from 'react-native'
import { colors, font } from '../theme'

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Delete',
  busy = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean
  title: string
  message: string
  confirmText?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={busy}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.confirmBtn, busy && styles.confirmBtnBusy]} onPress={onConfirm} disabled={busy}>
              <Text style={styles.confirmText}>{busy ? 'Deleting…' : confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  title: { color: colors.danger, fontWeight: '800', fontSize: font.lg, marginBottom: 8, textAlign: 'center' },
  message: { color: colors.ink, fontSize: font.md, lineHeight: 20, textAlign: 'center', marginBottom: 18 },
  actions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  cancelText: { color: colors.ink, fontWeight: '800', fontSize: font.md },
  confirmBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.danger,
    backgroundColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmBtnBusy: { opacity: 0.6 },
  confirmText: { color: '#ffffff', fontWeight: '800', fontSize: font.md },
})