import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

const VALIDATION_CONSTANTS = {
  EMPTY_VALUES: [undefined, null, '', NaN],
  VALIDATION_ERROR: 'Validation failed (numeric string is expected)',
  RADIX: 10,
};

@Injectable()
export class OptionalParseIntPipe implements PipeTransform {
  transform(value: string | undefined): number | undefined {
    const isEmpty = VALIDATION_CONSTANTS.EMPTY_VALUES.includes(value as any);
    if (isEmpty) {
      return undefined;
    }

    const parsed = parseInt(value as string, VALIDATION_CONSTANTS.RADIX);

    if (isNaN(parsed)) {
      throw new BadRequestException(VALIDATION_CONSTANTS.VALIDATION_ERROR);
    }

    return parsed;
  }
}
