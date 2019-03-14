export interface MediaInfoTrack {
  _type: string
  count: number
  countOfStreamOfThisKind: number
  kindOfStream: string
  streamIdentifier: number
  countOfVideoStreams: number
  countOfAudioStreams: number
  othercount: number
  videoFormatList: string
  videoFormatWithhintList: string
  codecsVideo: string
  videoLanguageList: string
  audioFormatList: string
  audioFormatWithhintList: string
  audioCodecs: string
  audioLanguageList: string
  otherFormatList: string
  otherFormatWithhintList: string
  otherLanguageList: string
  completeName: string
  fileName: string
  fileExtension: string
  format: string
  formatExtensionsUsuallyUsed: string
  commercialName: string
  formatProfile: string
  internetMediaType: string
  codecId: any
  codecIdUrl: string
  codecidVersion: number
  codecidCompatible: string
  codec: string
  codecExtensionsUsuallyUsed: string
  fileSize: number
  duration: number
  overallBitRate: number
  frameRate: number
  frameCount: number
  streamSize: number
  proportionOfThisStream: number
  headersize: number
  datasize: number
  footersize: number
  isstreamable: string
  encodedDate: string
  taggedDate: string
  fileLastModificationDate: string
  fileLastModificationDateLocal: string
  writingLibrary: string
  encodedLibraryName: string
  encodedLibraryVersion: string
  comapplequicktimeplayermovieaudiomute: string
  streamorder?: number
  id?: number
  formatInfo: string
  formatUrl: string
  formatSettings: string
  formatSettingsCabac: string
  formatSettingsReframes?: number
  formatSettingsGop: string
  codecIdInfo: string
  codecFamily: string
  codecInfo: string
  codecUrl: string
  codecCc: any
  codecProfile: string
  codecSettings: string
  codecSettingsCabac: string
  codecSettingsRefframes?: number
  bitRate?: number
  width?: number
  height?: number
  storedHeight?: number
  sampledWidth?: number
  sampledHeight?: number
  pixelAspectRatio?: number
  displayAspectRatio?: number
  rotation?: number
  frameRateMode: string
  resolution?: number
  colorimetry: string
  colorSpace: string
  chromaSubsampling: string
  bitDepth?: number
  scanType: string
  interlacement: string
  bitsPixelFrame?: number
  delay?: number
  delaySettings: string
  delayDropframe: string
  delayOrigin: string
  language: string
  colorRange: string
  colourDescriptionPresent: string
  colorPrimaries: string
  transferCharacteristics: string
  matrixCoefficients: string
  sourceDuration?: number
  bitRateMode: string
  channelS?: number
  channelPositions: string
  channellayout: string
  samplesPerFrame?: number
  samplingRate?: number
  samplesCount?: number
  sourceFrameCount?: number
  compressionMode: string
  delayRelativeToVideo?: number
  video0Delay?: number
  sourceStreamSize?: number
  sourceStreamsizeProportion?: number
  type: string
  timeCodeOfFirstFrame: string
  timeCodeStriped: string
}
