import React from 'react';
import {
  Dimensions,
  ImageBackground,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { space } from '../theme';

const HEADER_HEIGHT = Dimensions.get('window').height * 0.35;

type PhotoHeaderProps = {
  source: ImageSourcePropType;
  credit: string;
  children: React.ReactNode;
};

/** Shared, legible photo header used by authentication and the home screen. */
export function PhotoHeader({ source, credit, children }: PhotoHeaderProps) {
  return (
    <ImageBackground
      source={source}
      resizeMode="cover"
      accessibilityLabel="University campus"
      style={{ height: HEADER_HEIGHT, justifyContent: 'flex-end', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          paddingHorizontal: space.xl,
          paddingBottom: space.xl,
          backgroundColor: 'rgba(6,32,27,0.43)',
        }}
      >
        {children}
        <Text
          style={{
            position: 'absolute',
            right: 12,
            bottom: 6,
            color: 'rgba(255,255,255,0.78)',
            fontSize: 9,
          }}
        >
          Photo: {credit} / Unsplash
        </Text>
      </View>
    </ImageBackground>
  );
}

type PhotoHeadingProps = {
  children: React.ReactNode;
  subtitle?: string;
};

export function PhotoHeading({ children, subtitle }: PhotoHeadingProps) {
  return (
    <View>
      <Text
        style={{
          fontSize: 31,
          fontWeight: '800',
          letterSpacing: -0.5,
          color: '#fff',
        }}
      >
        {children}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.92)',
            marginTop: 5,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
