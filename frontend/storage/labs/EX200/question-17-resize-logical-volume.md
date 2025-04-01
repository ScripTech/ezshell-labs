---
title: "Resize Logical Volume"
order: 17
description: "Resize an existing logical volume to a specific size"
difficulty: "medium"
points: 12
hint: "resize-lv-hint"
validationSteps:
  - "Check current LV size"
  - "Verify filesystem type"
  - "Validate resize operation"
  - "Test filesystem integrity"
  - "Verify data preservation"
---
### Resizing a Logical Volume

* Resize your "vo" logical volume
* The new size should be approximately 300MB (acceptable range: 270MB to 290MB)
* Ensure data is preserved during resize
* Filesystem must be resized accordingly

#### Expected Result
- "vo" logical volume resized to within the specified range
- Filesystem properly resized
- All existing data preserved
- Mount point accessible
