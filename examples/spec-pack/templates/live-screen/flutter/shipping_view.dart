import 'package:flutter/widgets.dart';

/// Controller the shipping screen already uses.
/// A test supplies a real controller or a fake of this type.
abstract class CaptureController {
  Future<void> capture();
  int get capturedCount;
}

class ShippingScreen extends StatelessWidget {
  const ShippingScreen({super.key, required this.controller, required this.title});

  final CaptureController controller;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Text(title, key: const Key('screen-title')),
          ),
        ),
        GestureDetector(
          key: const Key('primary-action'),
          onTap: () {
            controller.capture();
          },
          child: const Text('Capture'),
        ),
      ],
    );
  }
}
