import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

export const useNav = () => useNavigation<NativeStackNavigationProp<RootStackParamList>>();
export const useParams = <K extends keyof RootStackParamList>() =>
  useRoute<RouteProp<RootStackParamList, K>>().params;
