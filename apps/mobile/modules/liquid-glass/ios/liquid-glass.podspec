Pod::Spec.new do |s|
  s.name           = 'liquid-glass'
  s.version        = '1.0.0'
  s.summary        = 'Liquid Glass module'
  s.description    = 'Liquid Glass module for Expo'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '15.0'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
