import Ionicons from '@expo/vector-icons/Ionicons';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Typography } from '@/lib/theme';

type ProfileAvatarPickerProps = {
  avatar?: string | null;
  initials: string;
  size?: number;
  saving?: boolean;
  onChange: (uri: string | null) => Promise<void> | void;
};

function extensionFromUri(uri: string) {
  const clean = uri.split('?')[0] ?? '';
  const match = clean.match(/\.(jpg|jpeg|png|webp|heic)$/i);
  return match ? match[0].toLowerCase() : '.jpg';
}

function persistAvatarUri(uri: string) {
  try {
    const avatarsDir = new Directory(Paths.document, 'avatars');
    avatarsDir.create({ idempotent: true, intermediates: true });

    const nextFile = new File(
      avatarsDir,
      `profile-avatar-${Date.now()}${extensionFromUri(uri)}`,
    );
    new File(uri).copy(nextFile);
    return nextFile.uri;
  } catch {
    return uri;
  }
}

export function ProfileAvatarPicker({
  avatar,
  initials,
  size = 68,
  saving = false,
  onChange,
}: ProfileAvatarPickerProps) {
  const pickImage = async () => {
    if (saving) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await onChange(persistAvatarUri(result.assets[0].uri));
    }
  };

  return (
    <Pressable
      accessibilityLabel="Change profile picture"
      disabled={saving}
      hitSlop={8}
      onPress={pickImage}
      style={[
        S.wrap,
        { width: size, height: size, borderRadius: size / 2 },
        saving && S.saving,
      ]}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={[S.image, { borderRadius: size / 2 }]} />
      ) : (
        <Text style={[S.initials, { fontSize: Math.max(15, Math.floor(size * 0.3)) }]}>
          {initials}
        </Text>
      )}
      <View style={S.editBadge}>
        <Ionicons name="camera" size={13} color={Colors.bg1} />
      </View>
    </Pressable>
  );
}

export async function removeProfileAvatar(onChange: (uri: string | null) => Promise<void> | void) {
  await onChange(null);
}

const S = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accentMid,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'visible',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  initials: {
    ...Typography.h2,
    color: Colors.accentLight,
    fontWeight: '700',
  },
  editBadge: {
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderColor: Colors.bg2,
    borderRadius: Radius.full,
    borderWidth: 2,
    bottom: -2,
    height: 26,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    width: 26,
  },
  saving: { opacity: 0.65 },
});
