import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const COLORS = {
  background: '#ffffff',
  surface: '#FFFFFF',
  ink: '#1F2A44',
  muted: '#6B7691',
  line: '#D9DFEA',
  question: '#2F5BEA',
  answer: '#1E8E6E', 
  danger: '#C43D3D',
};

const CARD_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

//DEFAULT CARDS
const STARTER_CARDS = [
  {
    id: '1',
    question: 'What is Android Studio?',
    answer: 'A development environment for building Android applications.',
  },
  {
    id: '2',
    question: 'What is the Android SDK?',
    answer: 'Android SDK is a collection of tools and APIs used to develop Android applications.',
  },
  {
    
    id: '3',
    question: 'What is a View in Android?',
    answer: 'A View is a UI element, such as a Button, TextView, or EditText, that displays or receives user interaction.',
  },
  {
    
    id: '4',
    question: 'What is XML used for in Android development?',
    answer: 'XML is traditionally used to define Android layouts and other application resources.',
  },
];

const makeId = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;


function AppButton({ title, onPress, variant = 'primary', disabled = false, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        buttonVariants[variant],
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <Text style={[styles.buttonText, buttonTextVariants[variant]]}>{title}</Text>
    </Pressable>
  );
}

function FlashcardApp() {
  const insets = useSafeAreaInsets();

  // Cards and which one is showing
  const [cards, setCards] = useState(STARTER_CARDS);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Add / edit form
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null); // adding a new card
  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');

  // Flip animation
  const scaleX = useRef(new Animated.Value(1)).current;
  const isFlipping = useRef(false);

  const currentCard = cards[index];
  const canSave = questionText.trim().length > 0 && answerText.trim().length > 0;

  const goToCard = (nextIndex) => {
    scaleX.stopAnimation();
    scaleX.setValue(1);
    isFlipping.current = false;
    setShowAnswer(false);
    setIndex(nextIndex);
  };

  const handlePrevious = () => {
    if (index > 0) goToCard(index - 1);
  };

  const handleNext = () => {
    if (index < cards.length - 1) goToCard(index + 1);
  };

  const flipCard = () => {
    if (!currentCard || isFlipping.current) return;
    isFlipping.current = true;

    Animated.timing(scaleX, { toValue: 0, duration: 120, useNativeDriver: true }).start(
      ({ finished }) => {
        if (!finished) {
          isFlipping.current = false;
          return;
        }
        setShowAnswer((previous) => !previous);
        Animated.timing(scaleX, { toValue: 1, duration: 120, useNativeDriver: true }).start(() => {
          isFlipping.current = false;
        });
      }
    );
  };


  const openAddModal = () => {
    setEditingId(null);
    setQuestionText('');
    setAnswerText('');
    setModalVisible(true);
  };

  const openEditModal = () => {
    if (!currentCard) return;
    setEditingId(currentCard.id);
    setQuestionText(currentCard.question);
    setAnswerText(currentCard.answer);
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);

  const saveCard = () => {
    const question = questionText.trim();
    const answer = answerText.trim();
    if (!question || !answer) return;

    if (editingId) {
      setCards((previous) =>
        previous.map((card) => (card.id === editingId ? { ...card, question, answer } : card))
      );
    } else {
      setCards((previous) => [...previous, { id: makeId(), question, answer }]);
      goToCard(cards.length); // jump to the card that is just added
    }
    closeModal();
  };

  const deleteCurrentCard = () => {
    const remaining = cards.filter((card) => card.id !== currentCard.id);
    setCards(remaining);
    goToCard(Math.min(index, Math.max(remaining.length - 1, 0)));
  };

  const confirmDelete = () => {
    if (!currentCard) return;
    Alert.alert('Delete this card?', 'The question and answer will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: deleteCurrentCard },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Flashcards</Text>
        <AppButton
          title="Add Card"
          variant="secondary"
          onPress={openAddModal}
          style={styles.headerButton}
        />
      </View>

      {currentCard ? (
        <>
          <View style={styles.progressWrap}>
            <Text style={styles.progressText}>
              Card {index + 1} of {cards.length}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${((index + 1) / cards.length) * 100}%` }]}
              />
            </View>
          </View>

          <ScrollView style={styles.cardArea} contentContainerStyle={styles.cardAreaContent}>
            <Pressable
              onPress={flipCard}
              accessibilityRole="button"
              accessibilityLabel={showAnswer ? 'Show question' : 'Show answer'}
            >
              <Animated.View
                style={[
                  styles.card,
                  { borderTopColor: showAnswer ? COLORS.answer : COLORS.question },
                  { transform: [{ scaleX }] },
                ]}
              >
                <Text
                  style={[
                    styles.cardLabel,
                    { color: showAnswer ? COLORS.answer : COLORS.question },
                  ]}
                >
                  {showAnswer ? 'Answer' : 'Question'}
                </Text>
                <View style={styles.cardBody}>
                  <Text style={styles.cardText}>
                    {showAnswer ? currentCard.answer : currentCard.question}
                  </Text>
                </View>
              </Animated.View>
            </Pressable>
          </ScrollView>

          <View style={styles.controls}>
            <AppButton title={showAnswer ? 'Show Question' : 'Show Answer'} onPress={flipCard} />
            <View style={styles.row}>
              <AppButton
                title="Previous"
                variant="secondary"
                onPress={handlePrevious}
                disabled={index === 0}
                style={styles.rowButton}
              />
              <AppButton
                title="Next"
                variant="secondary"
                onPress={handleNext}
                disabled={index === cards.length - 1}
                style={styles.rowButton}
              />
            </View>
            <View style={styles.row}>
              <AppButton
                title="Edit"
                variant="ghost"
                onPress={openEditModal}
                style={styles.rowButton}
              />
              <AppButton
                title="Delete"
                variant="danger"
                onPress={confirmDelete}
                style={styles.rowButton}
              />
            </View>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No cards yet</Text>
          <Text style={styles.emptyText}>
            Add your first question and answer to start studying.
          </Text>
          <AppButton title="Add Card" onPress={openAddModal} />
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
            <Text style={styles.sheetTitle}>{editingId ? 'Edit Card' : 'New Card'}</Text>

            <Text style={styles.inputLabel}>Question</Text>
            <TextInput
              style={styles.input}
              value={questionText}
              onChangeText={setQuestionText}
              placeholder="What do you want to remember?"
              placeholderTextColor={COLORS.muted}
              multiline
              autoFocus
            />

            <Text style={styles.inputLabel}>Answer</Text>
            <TextInput
              style={styles.input}
              value={answerText}
              onChangeText={setAnswerText}
              placeholder="Write the answer"
              placeholderTextColor={COLORS.muted}
              multiline
            />

            <View style={[styles.row, styles.sheetActions]}>
              <AppButton
                title="Cancel"
                variant="secondary"
                onPress={closeModal}
                style={styles.rowButton}
              />
              <AppButton
                title="Save Card"
                onPress={saveCard}
                disabled={!canSave}
                style={styles.rowButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <FlashcardApp />
    </SafeAreaProvider>
  );
}

const buttonVariants = {
  primary: { backgroundColor: COLORS.question },
  secondary: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.line },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'transparent' },
};

const buttonTextVariants = {
  primary: { color: '#FFFFFF' },
  secondary: { color: COLORS.ink },
  ghost: { color: COLORS.question },
  danger: { color: COLORS.danger },
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.ink,
  },
  headerButton: {
    minHeight: 40,
    paddingHorizontal: 16,
  },

  // Progress
  progressWrap: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.line,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.question,
  },

  // Card
  cardArea: {
    flex: 1,
  },
  cardAreaContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    minHeight: 260,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderTopWidth: 5,
    padding: 24,
    shadowColor: COLORS.ink,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardBody: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  cardText: {
    fontFamily: CARD_FONT,
    fontSize: 24,
    lineHeight: 34,
    color: COLORS.ink,
    textAlign: 'center',
  },

  // Controls
  controls: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowButton: {
    flex: 1,
  },

  // Buttons
  button: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.ink,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 12,
  },

  // Add / edit form
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(31, 42, 68, 0.45)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.ink,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    minHeight: 64,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    padding: 12,
    fontSize: 16,
    color: COLORS.ink,
    textAlignVertical: 'top',
  },
  sheetActions: {
    marginTop: 20,
  },
});