from src.services.insurance import match_insurance, normalize_payer, valid_npi


def test_normalize_payer_ignores_case_spaces_and_punctuation():
    assert normalize_payer('Blue-Cross / Blue Shield') == 'bluecrossblueshield'
    assert normalize_payer(' Aetna ') == 'aetna'


def test_valid_npi_requires_exactly_ten_digits():
    assert valid_npi('1234567890') is True
    assert valid_npi('123456789') is False
    assert valid_npi('123456789a') is False
    assert valid_npi(None) is False


def test_match_insurance_returns_declared_plan_and_source():
    result = match_insurance('blue-cross', ['Blue Cross', 'Aetna'])

    assert result.verified is True
    assert result.matched_plan == 'Blue Cross'
    assert result.source == 'doctor_declared_network'


def test_match_insurance_returns_unverified_for_unknown_plan():
    result = match_insurance('Cigna', ['Blue Cross', 'Aetna'])

    assert result.verified is False
    assert result.matched_plan is None
    assert result.requested == 'Cigna'
