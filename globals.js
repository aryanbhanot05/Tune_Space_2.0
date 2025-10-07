import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { TextDecoder, TextEncoder } from 'text-encoding';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;